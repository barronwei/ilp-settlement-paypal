# PayPal ILP Settlement Engine :money:

This repository houses an implementation of an ILP settlement engine for PayPal!

Due to the limitations of `paypal-rest-sdk`, this settlement engine requires transactions to occur between PayPal business accounts. In order to listen for payments, this engine requires manual configuration of an endpoint for Instant Payment Notifications.

## Usage

Create a PayPal application in live or sandbox mode on developer site. Configure `launch.ts` with the corresponding PayPal email, id, and secret of the application. In the settings of the PayPal business account, add the endpoint url that listens for Instant Payment Notifications. The url follows this format: `https://{hostname}/{clientid}/ipn`.

To launch this settlement engine, run one of the following:

```
npm run start
```

```
npm run debug
```

## Contributing

Pull requests are welcome. Please fork the repository and submit!
