# PayPal ILP Settlement Engine

This repository houses an implementation of an ILP settlement engine for PayPal!

Due to the limitations of `paypal-rest-sdk`, this settlement engine requires transactions to occur between business accounts. In order to listen for payments, this engine requires manual configuration of a https link for Instant Payment Notifications. In order to run on localhost, this engine utilizes `ngrok`. 

## Usage

Create a PayPal application in `live` or `sandbox` mode on developer site. Configure `launch.ts` with the corresponding PayPal email, id, and secret of the application.

In the settings of the PayPal business account, add the endpoint url that listens for Instant Payment Notifications. The url should be in the following format:

```
{host}/{id}/ipn
```

With that in place, run `npm run start` to launch this settlement engine or run `npm run debug` to do so with additional console logging.

## Contributing

Pull requests are welcome. Please fork the repository and submit!
