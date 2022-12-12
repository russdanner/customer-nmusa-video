import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { getDescriptor } from '@craftercms/redux';

import HeaderHolder from './HeaderStyle';
import HeaderSearch from './HeaderSearch';

import { isNullOrUndefined } from '../../utils';

class Header extends Component {
  constructor(props) {
    super(props);

    this.levelDescriptorUrl = '/site/website/crafter-level-descriptor.level.xml';

    if (isNullOrUndefined(props.descriptors[this.levelDescriptorUrl])) {
      this.props.getDescriptor(this.levelDescriptorUrl);
    }
  }

  renderNavItems() {
    var rootId = '/';

    return this.props.nav.childIds[rootId].map((id, i) => {
      var navItem = this.props.nav.entries[id];

      return (
        <li key={i} className="navigation__item">
          <Link className="navigation__link navigation__link--apps" to={navItem.url}>
            <span className="navigation__link--text">
              {navItem.label}
            </span>
          </Link>
        </li>
      );
    });
  }

  renderHeaderLogo(descriptor) {
    const {siteLogo, logoLink_s, logoLinkopeninnewtab_b} = descriptor.component;

    return (
      <a
        className="header__logo active"
        href={logoLink_s}
        target={logoLinkopeninnewtab_b === 'true' ? '_blank' : '_self'}
        style={{ backgroundImage: `url(${siteLogo})` }}
      >
        Video Center
      </a>
    );
  }

  renderHeaderHomeLink(descriptor) {
    const {homeText_s, homeLink_s} = descriptor.component;

    return (
      <li className="navigation__item">
        <Link className="navigation__link navigation__link--apps" to={homeLink_s}>
          <span className="navigation__link--text">
            {homeText_s}
          </span>
        </Link>
      </li>
    )
  }

  render() {
    const { nav, descriptors } = this.props;
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    return (
      <HeaderHolder>
        <header
          id="mainHeader"
          className={'header ' + (this.props.headerGhost ? 'header--ghost ' : ' ') + (iOS ? 'ios' : '')}
        >
          <div className="header__container">
            <div className="header__overlay"></div>

            {descriptors && descriptors[this.levelDescriptorUrl] &&
            this.renderHeaderLogo(descriptors[this.levelDescriptorUrl])
            }

            <div className="header__navigation">
              <nav className="navigation">
                <ul className="navigation__list">
                  {descriptors && descriptors[this.levelDescriptorUrl] &&
                    this.renderHeaderHomeLink(descriptors[this.levelDescriptorUrl])
                  }
                  {
                    nav
                    && nav.entries['/']
                    && this.renderNavItems()
                  }
                </ul>
              </nav>
            </div>
            <div className="header__search">
              <div>
                <HeaderSearch />
              </div>
            </div>
          </div>
        </header>
      </HeaderHolder>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  getDescriptor: url => dispatch(getDescriptor(url))
});

const mapStateToProps = store => ({
  nav: store.craftercms.navigation,
  descriptors: store.craftercms.descriptors.entries,
  headerGhost: store.header.headerGhost
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
