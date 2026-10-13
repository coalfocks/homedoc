import {
  forwardMarketingAuthRedirect,
  isMarketingAuthRedirect,
} from './marketingAuthRedirect';

describe('marketing auth redirect fallback', () => {
  it('does not redirect ordinary marketing visits', () => {
    expect(isMarketingAuthRedirect('https://homedocumentation.com/')).toBe(
      false,
    );
    expect(
      isMarketingAuthRedirect('https://homedocumentation.com/privacy'),
    ).toBe(false);
    expect(
      isMarketingAuthRedirect(
        'https://homedocumentation.com/?utm_source=mail#section',
      ),
    ).toBe(false);
  });

  it('forwards only hash access and refresh tokens plus approved auth fields', () => {
    const replace = jest.fn();
    const redirected = forwardMarketingAuthRedirect(
      'https://www.homedocumentation.com/#access_token=access-test&refresh_token=refresh-test&type=magiclink&expires_in=3600&redirect_to=https%3A%2F%2Fevil.example&unrelated=discard',
      replace,
    );

    expect(redirected).toBe(true);
    expect(replace).toHaveBeenCalledWith(
      'https://app.homedocumentation.com/auth/callback#access_token=access-test&refresh_token=refresh-test&expires_in=3600&type=magiclink',
    );
  });

  it('forwards PKCE codes and auth errors in query or hash', () => {
    const replace = jest.fn();

    expect(
      forwardMarketingAuthRedirect(
        'https://homedocumentation.com/?code=pkce-test&redirect_to=https%3A%2F%2Fevil.example&next=%2Fadmin',
        replace,
      ),
    ).toBe(true);
    expect(replace).toHaveBeenLastCalledWith(
      'https://app.homedocumentation.com/auth/callback?code=pkce-test',
    );

    expect(
      forwardMarketingAuthRedirect(
        'https://homedocumentation.com/#error=access_denied&error_code=otp_expired&error_description=Link+expired&next=%2Fadmin',
        replace,
      ),
    ).toBe(true);
    expect(replace).toHaveBeenLastCalledWith(
      'https://app.homedocumentation.com/auth/callback#error=access_denied&error_code=otp_expired&error_description=Link+expired',
    );

    expect(
      forwardMarketingAuthRedirect(
        'https://homedocumentation.com/?error=access_denied&error_description=Consent+was+cancelled&redirect_to=https%3A%2F%2Fevil.example',
        replace,
      ),
    ).toBe(true);
    expect(replace).toHaveBeenLastCalledWith(
      'https://app.homedocumentation.com/auth/callback?error=access_denied&error_description=Consent+was+cancelled',
    );
  });

  it('rejects incomplete or duplicate token pairs and duplicate PKCE codes', () => {
    const replace = jest.fn();
    const invalidUrls = [
      'https://homedocumentation.com/#access_token=access-test',
      'https://homedocumentation.com/#access_token=one&access_token=two&refresh_token=refresh-test',
      'https://homedocumentation.com/?code=one&code=two',
    ];

    for (const url of invalidUrls) {
      expect(forwardMarketingAuthRedirect(url, replace)).toBe(false);
    }
    expect(replace).not.toHaveBeenCalled();
  });

  it('rejects unapproved hosts, protocols, and paths even with auth-looking fields', () => {
    const replace = jest.fn();
    const maliciousUrls = [
      'https://evil.example/?code=pkce-test',
      'https://homedocumentation.com.evil.example/?code=pkce-test',
      'http://homedocumentation.com/?code=pkce-test',
      'https://homedocumentation.com:8443/?code=pkce-test',
      'https://user@homedocumentation.com/?code=pkce-test',
      'https://homedocumentation.com/unrelated?code=pkce-test',
    ];

    for (const url of maliciousUrls) {
      expect(forwardMarketingAuthRedirect(url, replace)).toBe(false);
    }
    expect(replace).not.toHaveBeenCalled();
  });
});
