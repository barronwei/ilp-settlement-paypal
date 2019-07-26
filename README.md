# PayPal ILP Settlement Engine

This repository houses an implementation of an ILP settlement engine for PayPal per the proposed [Settlement RFC](https://github.com/interledger/rfcs/pull/536)!

Due to the limitations of `paypal-rest-sdk`, this settlement engine requires transactions to occur between PayPal business accounts. In order to listen for payments, this engine requires manual configuration of account settings to include an endpoint for Instant Payment Notifications.

## Usage

[Create](https://developer.paypal.com/developer/applications/create) a PayPal application in live or sandbox mode on the developer site.

Configure `launch.ts` with the corresponding PayPal email, id, and secret of the application.

In the [settings](https://www.sandbox.paypal.com/businessmanage/settings/website) of the PayPal business account, add the endpoint url that listens for Instant Payment Notifications. The url is set to follow this format: `https://{hostname}/{clientid}/ipn`.

To launch, run:

```
npm run start
```

## Contributing

Pull requests are welcome. Please fork the repository and submit!
