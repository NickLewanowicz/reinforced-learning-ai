# reinforcement-learning-ai

This web app initializes a finite state machine (for our purposes this is a satelite) which has 8 possible actions with 8 different results. Each of the results can vary due to 'signal noise' which will effect the learning automatas desision making.

Given the finite state machine we have implemented 4 possible learning automata Tsetlin, Krinsky, Krylov, and LRI. Also nearly all relevant options have been exposed to the user to configure like trials, iterations, ensamble, signal weights, noise ect. 

This app will serve as a learning tool to visualize the difference between the several learning automata and how the various properties of which can have an impact on the learning.

There is a demo of this application available [here](https://nicklewanowicz.github.io/reinforced-learning-ai/) if you wish to run this locally the below directions will outline how to do so.

## Installation

* `git clone <repository-url>` this repository
* `cd reinforcement-learning-ai`
* `npm install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).
* Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

If you wish to deploy to gh pages you can do `npm run deploy`

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [learning automata] (https://en.wikipedia.org/wiki/Learning_automata)
