# PayPal ILP Settlement Engine

This repository houses an implementation of an ILP settlement engine for PayPal!

Due to the limitations of the PayPal REST SDK, this settlement engine requires transactions to occur between business accounts. In order to listen for payments, this engine requires manual configuration of a https link for Instant Payment Notifications. In order to run on localhost, this engine utilizes `ngrok`. 

## Getting Started

Create an application on https://developer.paypal.com in `live` or `sandbox` mode. Configure `launch.ts` with the PayPal email, id, and secret corresponding with the application. In the settings of the PayPal business account, add the following endpoint url to listen for Instant Payment Notifications: ```https://${host_name}/{client_id}/ipn``` 

With that, run `npm run start` to launch the settlement engine or `npm run debug` to do so with additional console logging.

### Prerequisites

A PayPal business account is required. Feel 
