import React from 'react';
import Page from './Page';
import { CoriolisLogo, GitHub } from '../components/SvgIcons';

/**
 * About Page
 */
export default class AboutPage extends Page {

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    this.state = {
      title: 'About Coriolis'
    };
  }

  /**
   * Render the Page
   * @return {React.Component} The page contents
   */
  renderPage() {
    return <div className={'page'} style={{ textAlign: 'left', maxWidth: 800, margin: '0 auto' }}>
      <h1><CoriolisLogo style={{ marginRight: '0.4em' }} className='xl'/><span className='warning'>Coriolis EDCD Edition</span></h1>

      <p>This is a clone of the Coriolis project, whose original author is currently unable to maintain it. This clone is maintained by the <a href="http://edcd.github.io/">EDCD community</a>.</p>
      <p>To recover your builds, go to <a href='https://coriolis.io/' target='_blank'>https://coriolis.io/</a>, backup your builds (Settings / Backup), copy the text, return here and import (Settings / Import).</p>
      <p>The Coriolis project was inspired by <a href='http://www.edshipyard.com/' target='_blank'>E:D Shipyard</a> and, of course, <a href='http://www.elitedangerous.com' target='_blank'>Elite Dangerous</a>. The ultimate goal of Coriolis is to provide rich features to support in-game play and planning while engaging the E:D community to support its development.</p>
      <p>Coriolis was created using assets and imagery from Elite: Dangerous, with the permission of Frontier Developments plc, for non-commercial purposes. It is not endorsed by nor reflects the views or opinions of Frontier Developments.  A number of assets were sourced from <a href='http://edassets.org' target='_blank'>ED Assets</a></p>

      <a style={{ display: 'block', textDecoration: 'none' }} href='https://github.com/EDCD/coriolis' target='_blank' title='Coriolis Github Project'>
        <GitHub style={{ margin: '0.4em' }} className='l fg xl'/>
        <h2 style={{ margin: 0, textDecoration: 'none' }}>Github</h2>
        github.com/EDCD/coriolis
      </a>

      <p>Coriolis is an open source project. Checkout the list of upcoming features and to-do list on github. Any and all contributions and feedback are welcome. If you encounter any bugs please report them and provide as much detail as possible.</p>

      <h3>Chat</h3>
      <p>You can chat to us on our <a href='https://discord.gg/0uwCh6R62aPRjk9w' target='_blank'>EDCD Discord server</a>.</p>

      <h3>Supporting Coriolis</h3>
      <p>Coriolis is an open source project, and I work on it in my free time. I have set up a patreon at <a href='https://www.patreon.com/coriolis_elite'>patreon.com/coriolis_elite</a>, which will be used to keep Coriolis up to date and the servers running.</p>
    </div>;
  }
}
