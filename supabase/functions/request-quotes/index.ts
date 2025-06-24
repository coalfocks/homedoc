import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER');
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL');

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const {
    title,
    description,
    zip,
    images = [],
    businessLimit = 5,
  } = await req.json();

  let businesses: { name: string; phone?: string; email?: string }[] = [];
  if (GOOGLE_API_KEY) {
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        title + ' in ' + zip,
      )}&key=${GOOGLE_API_KEY}`,
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const placeIds = (searchData.results ?? [])
        .slice(0, businessLimit)
        .map((p: any) => p.place_id);
      for (const id of placeIds) {
        const detailsRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${id}&fields=name,formatted_phone_number,website&key=${GOOGLE_API_KEY}`,
        );
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const res = detailsData.result;
          if (res) {
            let email: string | undefined;
            if (res.website) {
              try {
                const siteRes = await fetch(res.website);
                if (siteRes.ok) {
                  const html = await siteRes.text();
                  const match = html.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/);
                  if (match) {
                    email = match[0];
                  }
                }
              } catch (_) {
                /* ignore */
              }
            }
            businesses.push({
              name: res.name,
              phone: res.formatted_phone_number,
              email,
            });
          }
        }
      }
    }
  }

  const message = `${title}: ${description}\n${images.join(', ')}`;
  let diyEstimate: string | null = null;
  if (OPENAI_API_KEY) {
    const oaRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You estimate time, effort and cost for homeowners doing projects themselves.',
          },
          {
            role: 'user',
            content: `Provide an estimate of time, effort level and expected price range to DIY this job: ${title}. Details: ${description}`,
          },
        ],
      }),
    });
    if (oaRes.ok) {
      const oaData = await oaRes.json();
      diyEstimate = oaData.choices?.[0]?.message?.content ?? null;
    }
  }

  const smsResults: Record<string, unknown>[] = [];
  const callResults: Record<string, unknown>[] = [];
  const emailResults: Record<string, unknown>[] = [];

  if (
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_FROM_NUMBER &&
    businesses.length
  ) {
    for (const biz of businesses) {
      if (!biz.phone) continue;
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      // send SMS
      const smsUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const smsBody = new URLSearchParams({
        From: TWILIO_FROM_NUMBER,
        To: biz.phone,
        Body: message,
      });
      const smsRes = await fetch(smsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: smsBody,
      });
      const smsData = await smsRes.json();
      smsResults.push({
        business: biz.name,
        status: smsRes.status,
        id: smsData.sid,
      });

      // voice call
      const callUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
      const callBody = new URLSearchParams({
        From: TWILIO_FROM_NUMBER,
        To: biz.phone,
        Twiml: `<Response><Say>${message}</Say></Response>`,
      });
      const callRes = await fetch(callUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: callBody,
      });
      const callData = await callRes.json();
      callResults.push({
        business: biz.name,
        status: callRes.status,
        id: callData.sid,
      });
    }
  }

  if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && businesses.length) {
    for (const biz of businesses) {
      if (!biz.email) continue;
      const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: biz.email }] }],
          from: { email: SENDGRID_FROM_EMAIL },
          subject: `Quote request: ${title}`,
          content: [{ type: 'text/plain', value: message }],
        }),
      });
      emailResults.push({ business: biz.name, status: emailRes.status });
    }
  }

  return new Response(
    JSON.stringify({
      businesses,
      smsResults,
      callResults,
      emailResults,
      diyEstimate,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
