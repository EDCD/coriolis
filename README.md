[![Chat to us on Discord](https://img.shields.io/badge/Discord-EDCD%20%23coriolis-blue.svg?style=social)](https://discord.gg/0uwCh6R62aPRjk9w)

## About

The Coriolis project was inspired by E:D Shipyard and, of course, [Elite Dangerous](http://www.elitedangerous.com). The ultimate goal of Coriolis is to provide rich features to support in-game play and planning while engaging the E:D community to support its development.

Coriolis was created using assets and imagery from Elite: Dangerous, with the permission of Frontier Developments plc, for non-commercial purposes. It is not endorsed by nor reflects the views or opinions of Frontier Developments and no employee of Frontier Developments was involved in the making of it.

## Contributing

- [Submit issues](https://github.com/EDCD/coriolis/issues)
- Fork the coriolis and coriolis-data repos from https://github.com/Brighter-Applications/coriolis/ and https://github.com/Brighter-Applications/coriolis-data/
- [Submit Coriolis pull requests](https://github.com/Brighter-Applications/coriolis/pulls) using `alpha` branch as the base
- [Submit Coriolis-data pull requests](https://github.com/Brighter-Applications/coriolis-data/pulls) using `alpha` branch as the base
- Chat to us on [Discord](https://discord.gg/0uwCh6R62aPRjk9w)!

## CMDR-Coriolis

CMDR-Coriolis is currently a closed source app while it goes through its initial development stages. My aim is to open-source it eventually alongside Coriolis in EDCD. Whilst it could be considered 'part' of Coriolis, it is in fact a Django application, where Coriolis is written in NodeJS, using the React framework.

[Read the development guide for third party developers on how to use the CMDR-Coriolis API to send CMDR Ship, Module and Material data to CMDR-Coriolis](https://github.com/Brighter-Applications/coriolis/blob/develop/CMDR.md)

## Development

This release includes the ability to run the app as a Docker container.
```sh
> git clone https://github.com/Brighter-Applications/coriolis.git
> git clone https://github.com/Brighter-Applications/coriolis-data.git
> cd coriolis
> docker buildx build --build-context data=../coriolis-data --tag coriolis .
> docker run -d -p 3300:3300 coriolis
```

Or to run an instance of coriolis without Docker Desktop, perform the following steps in a shell:
```sh
> git clone https://github.com/Brighter-Applications/coriolis.git
> git clone https://github.com/Brighter-Applications/coriolis-data.git
> cd ./coriolis-data
> npm install
> cd ../coriolis
> npm install --legacy-peer-deps
> npm start
```

You will then have a development server running on `localhost:3300`.

### Ship and Module Database

See the [Data wiki](https://github.com/EDCD/coriolis-data/wiki) for details on structure, etc.

## Deployment

Follow the steps for [Development](#development) as above, but instead
of `npm start` you'll want to:

```sh
> npm run build --legacy-peer-deps
```

this will result in a `build/` directory being created containing all the necessary files.

After this you need to serve the files in some manner.
Either configure your webserver to make the actual `build/` directory
visible on the web, or alternatively copy it to somewhere to serve it
from.
