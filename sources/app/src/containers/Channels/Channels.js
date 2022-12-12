import React, { Component } from 'react';
import { connect } from 'react-redux';

import ChannelsHolder from './ChannelsStyle';
import { setVideoDocked } from '../../actions/videoPlayerActions';
import VideoCategories from '../../components/VideoCategories/VideoCategories';

import { searchByCategory } from '../../libraries/search';
import { Constants } from '../../libraries/constants';

const CATEGORIES_KEYS = [Constants.FEATURED_CHANNELS, Constants.ALL_CHANNELS];

class Channels extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchId: this.props.match.params.query,
      fetchCategories: {}
    };
  }

  componentWillMount() {
    this.props.setVideoDocked(false);
  }

  componentDidMount() {
    this.fetchContents(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.fetchContents(newProps);
  }

  fetchContents(props) {
    if (!this.state.fetchCategories[Constants.FEATURED_CHANNELS]) {
      this.fetchContentsByCategory(this.getFeaturedChannelsCategory());
    }

    if (!this.state.fetchCategories[Constants.ALL_CHANNELS]) {
      this.fetchContentsByCategory(this.getAllChannelsCategory());
    }
  }

  fetchContentsByCategory(category) {
    searchByCategory(category).subscribe(res => {
      const { fetchCategories } = this.state;
      category.hits = res.hits;
      fetchCategories[category.key] = category;
      this.setState({ fetchCategories });
    });
  }

  getFeaturedChannelsCategory() {
    return {
      key: Constants.FEATURED_CHANNELS,
      value: 'Featured Channels',
      type: 'channel-card-alt',
      query: {
        'bool': {
          'filter': [
            {
              'match': {
                'content-type': '/component/component-channel'
              }
            },
            {
              'match': {
                'featured_b': true
              }
            }
          ]
        }
      }
    };
  }

  getAllChannelsCategory() {
    return {
      key: Constants.ALL_CHANNELS,
      value: 'All Channels',
      type: 'channel-card-alt',   //TO RENDER CHANNEL CARD STYLING
      query: {
        'bool': {
          'filter': [
            {
              'match': {
                'content-type': '/component/component-channel'
              }
            }
          ]
        }
      },
      numResults: 100
    };
  }

  buildCategories() {
    const { fetchCategories } = this.state;
    const categories = [];
    const keys = CATEGORIES_KEYS;
    for (let i = 0; i < keys.length; i += 1) {
      const hasItems = fetchCategories[keys[i]] && fetchCategories[keys[i]].hits && fetchCategories[keys[i]].hits.length > 0;
      if (hasItems) {
        categories.push(fetchCategories[keys[i]]);
      }
    }

    return categories;
  }

  render() {
    const shouldShowCats = CATEGORIES_KEYS.every(key => this.state.fetchCategories[key]);
    return (
      <ChannelsHolder>
        <div className="">
          {shouldShowCats && (
            <VideoCategories categories={this.buildCategories()} />
          )}
        </div>
      </ChannelsHolder>
    );
  }
}

function mapStateToProps(store) {
  return {
    videoInfo: store.video.videoInfo,
    videoStatus: store.video.videoStatus
  };
}

function mapDispatchToProps(dispatch) {
  return ({
    setVideoDocked: (docked) => {
      dispatch(setVideoDocked(docked));
    }
  });
}

export default connect(mapStateToProps, mapDispatchToProps)(Channels);
