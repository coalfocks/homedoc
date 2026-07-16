type AddressLike = {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
};

const clean = (value?: string | null) => value?.trim();

export const formatAddressLines = (address: AddressLike) => {
  const street = [clean(address.address_line_1), clean(address.address_line_2)]
    .filter(Boolean)
    .join(', ');
  const cityStateZip = [
    clean(address.city),
    clean(address.state),
    clean(address.zip_code),
  ]
    .filter(Boolean)
    .join(', ');

  return [street, cityStateZip].filter(Boolean);
};

export const formatAddressBlock = (
  address: AddressLike,
  fallback = 'Address not added yet.',
) => formatAddressLines(address).join('\n') || fallback;
