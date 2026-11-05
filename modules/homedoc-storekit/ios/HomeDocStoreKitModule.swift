import ExpoModulesCore
import Foundation
import StoreKit
import UIKit

public final class HomeDocStoreKitModule: Module {
  private var transactionUpdatesTask: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("HomeDocStoreKit")
    Events("onTransactionUpdate")

    OnCreate {
      self.transactionUpdatesTask = Task { [weak self] in
        for await verification in Transaction.updates {
          guard !Task.isCancelled,
                case .verified(let transaction) = verification,
                transaction.productType == .autoRenewable,
                let accountToken = transaction.appAccountToken,
                let self else { continue }

          self.sendEvent("onTransactionUpdate", [
            "transactionId": String(transaction.id),
            "productId": transaction.productID,
            "appAccountToken": accountToken.uuidString.lowercased()
          ])
        }
      }
    }

    OnDestroy {
      self.transactionUpdatesTask?.cancel()
      self.transactionUpdatesTask = nil
    }

    AsyncFunction("getProducts") { (productIDs: [String]) async throws -> [[String: Any]] in
      let products: [Product]
      do {
        products = try await Product.products(for: productIDs)
      } catch {
        throw StoreKitModuleException("StoreKit product lookup failed: \(String(describing: error))")
      }
      return products.map { product in
        let period = product.subscription?.subscriptionPeriod
        return [
          "productId": product.id,
          "title": product.displayName,
          "description": product.description,
          "price": NSDecimalNumber(decimal: product.price).doubleValue,
          "priceString": product.displayPrice,
          "currencyCode": product.priceFormatStyle.currencyCode,
          "subscriptionPeriod": period.map(Self.iso8601Period) as Any? ?? NSNull(),
          "isAutoRenewable": product.type == .autoRenewable
        ]
      }
    }

    AsyncFunction("purchase") { (productID: String, appAccountToken: String) async throws -> [String: String] in
      guard let accountToken = UUID(uuidString: appAccountToken) else {
        throw StoreKitModuleException("Invalid HomeDoc account token.")
      }

      let products = try await Product.products(for: [productID])
      guard let product = products.first(where: { $0.id == productID }) else {
        throw StoreKitModuleException("The selected App Store product is unavailable.")
      }
      guard product.type == .autoRenewable,
            product.subscription?.subscriptionPeriod != nil else {
        throw StoreKitModuleException("The selected App Store product is not an auto-renewable subscription.")
      }

      let result: Product.PurchaseResult
      do {
        result = try await Self.purchase(product, options: [.appAccountToken(accountToken)])
      } catch let error as StoreKitModuleException {
        throw error
      } catch {
        throw StoreKitModuleException("StoreKit purchase failed: \(String(describing: error))")
      }
      switch result {
      case .success(let verification):
        switch verification {
        case .verified(let transaction):
          guard transaction.productID == productID,
                transaction.appAccountToken == accountToken else {
            throw StoreKitModuleException("The App Store transaction did not match this HomeDoc account and product.")
          }
          return [
            "status": "purchased",
            "transactionId": String(transaction.id),
            "productId": transaction.productID
          ]
        case .unverified:
          throw StoreKitModuleException("Apple could not verify the purchase on this device.")
        }
      case .pending:
        return ["status": "pending"]
      case .userCancelled:
        return ["status": "cancelled"]
      @unknown default:
        throw StoreKitModuleException("The App Store returned an unknown purchase result.")
      }
    }

    AsyncFunction("getCurrentEntitlements") { (appAccountToken: String, productIDs: [String]) async throws -> [String] in
      guard let accountToken = UUID(uuidString: appAccountToken) else {
        throw StoreKitModuleException("Invalid HomeDoc account token.")
      }

      return await Self.currentTransactionIDs(appAccountToken: accountToken, productIDs: Set(productIDs))
    }

    AsyncFunction("restorePurchases") { (appAccountToken: String, productIDs: [String]) async throws -> [String] in
      guard let accountToken = UUID(uuidString: appAccountToken) else {
        throw StoreKitModuleException("Invalid HomeDoc account token.")
      }

      try await AppStore.sync()
      return await Self.currentTransactionIDs(appAccountToken: accountToken, productIDs: Set(productIDs))
    }

    AsyncFunction("finishTransaction") { (transactionID: String) async throws -> Bool in
      guard let id = UInt64(transactionID) else {
        throw StoreKitModuleException("Invalid App Store transaction identifier.")
      }

      for await verification in Transaction.unfinished {
        guard case .verified(let transaction) = verification,
              transaction.id == id else { continue }
        await transaction.finish()
        return true
      }
      return false
    }
  }

  // UIKit apps must tell StoreKit which scene hosts the purchase sheet. Without it,
  // iPadOS can fail to present the confirmation sheet, so the purchase never starts.
  @MainActor
  private static func foregroundWindowScene() -> UIWindowScene? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    return scenes.first { $0.activationState == .foregroundActive }
      ?? scenes.first { $0.activationState == .foregroundInactive }
      ?? scenes.first
  }

  private static func purchase(
    _ product: Product,
    options: Set<Product.PurchaseOption>
  ) async throws -> Product.PurchaseResult {
    if #available(iOS 17.0, *) {
      let scene = await foregroundWindowScene()
      if let scene {
        return try await product.purchase(confirmIn: scene, options: options)
      }
    }
    return try await product.purchase(options: options)
  }

  private static func currentTransactionIDs(appAccountToken: UUID, productIDs: Set<String>) async -> [String] {
    var transactionIDs = Set<String>()
    for await verification in Transaction.currentEntitlements {
      guard case .verified(let transaction) = verification,
            transaction.productType == .autoRenewable,
            productIDs.contains(transaction.productID),
            transaction.appAccountToken == appAccountToken,
            transaction.revocationDate == nil else { continue }
      transactionIDs.insert(String(transaction.id))
    }
    return transactionIDs.sorted()
  }

  private static func iso8601Period(_ period: Product.SubscriptionPeriod) -> String {
    let unit: String
    switch period.unit {
    case .day: unit = "D"
    case .week: unit = "W"
    case .month: unit = "M"
    case .year: unit = "Y"
    @unknown default: unit = "?"
    }
    return "P\(period.value)\(unit)"
  }
}

private final class StoreKitModuleException: Exception {
  private let message: String

  init(_ message: String) {
    self.message = message
    super.init(name: "StoreKitError", description: message)
  }

  override var reason: String {
    message
  }
}
