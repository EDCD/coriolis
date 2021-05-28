[![Chat to us on Discord](https://img.shields.io/badge/Discord-EDCD%20%23coriolis-blue.svg?style=social)](https://discord.gg/0uwCh6R62aPRjk9w)

## About

The Coriolis project was inspired by [E:D Shipyard](http://www.edshipyard.com/) and, of course, [Elite Dangerous](http://www.elitedangerous.com). The ultimate goal of Coriolis is to provide rich features to support in-game play and planning while engaging the E:D community to support its development.

Coriolis was created using assets and imagery from Elite: Dangerous, with the permission of Frontier Developments plc, for non-commercial purposes. It is not endorsed by nor reflects the views or opinions of Frontier Developments and no employee of Frontier Developments was involved in the making of it.

## Contributing

- [Submit issues](https://github.com/EDCD/coriolis/issues)
- [Submit pull requests](https://github.com/EDCD/coriolis/pulls) targetting `develop` branch
- Chat to us on [Discord](https://discord.gg/0uwCh6R62aPRjk9w)!

## Development

To get a local instance of coriolis running, perform the following steps in a shell:
```sh
> git clone https://github.com/EDCD/coriolis.git
> git clone https://github.com/EDCD/coriolis-data.git
> cd ./coriolis-data
> npm install
> cd ../coriolis
> npm install
> npm start
```

You will then have a development server running on `localhost:3300`.

### Ship and Module Database

See the [Data wiki](https://github.com/cmmcleod/coriolis-data/wiki) for details on structure, etc.

## Deployment

Follow the steps for [Development](#development) as above, but instead
of `npm start` you'll want to:

```sh
> npm run build
```

this will result in a `build/` directory being created containing all the necessary files.

After this you need to serve the files in some manner.
Either configure your webserver to make the actual `build/` directory
visible on the web, or alternatively copy it to somewhere to serve it
from.
