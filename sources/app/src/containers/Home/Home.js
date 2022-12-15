import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getDescriptor } from '@craftercms/redux';
import { setVideoDocked } from '../../actions/videoPlayerActions';
import { setHeaderGhost } from '../../actions/headerActions';
import Slider from '../../components/Slider/Slider';
import VideoCategories from '../../components/VideoCategories/VideoCategories';

import { nou } from '../../utils';
import { searchByCategory } from '../../libraries/search';
import { Constants } from '../../libraries/constants';

const CATEGORIES_KEYS = [Constants.FEATURED_VIDEOS, Constants.LATEST_VIDEOS, Constants.FEATURED_CHANNELS];

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fetchCategories: {},
    };
  }

  componentWillMount() {
    this.props.setVideoDocked(false);

    this.descriptorUrl = '/site/website/index.xml';

    if (nou(this.props.descriptors[this.descriptorUrl])) {
      this.props.getDescriptor(this.descriptorUrl);
    }
  }

  componentDidMount() {
    // this.props.setHeaderGhost(true);
    this.fetchContents(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.fetchContents(newProps);
  }

  componentWillUnmount() {
    this.props.setHeaderGhost(false);
  }

  renderSlider(descriptor) {
    if (descriptor.page.slider_o.item) {
      return (
        <Slider
          data={descriptor.page.slider_o.item}
          getDescriptor={this.props.getDescriptor}
          descriptors={this.props.descriptors}
        >
        </Slider>
      );
    }
  }

  fetchContents(props) {
    const { descriptors } = props;
    if (descriptors && descriptors[this.descriptorUrl]) {
      const descriptor = descriptors[this.descriptorUrl];
      if (!this.state.fetchCategories[Constants.FEATURED_VIDEOS]) {
        this.fetchContentsByCategory(this.getFeaturedVideoCategory(descriptor));
      }

      if (!this.state.fetchCategories[Constants.LATEST_VIDEOS]) {
        this.fetchContentsByCategory(this.getLatestVideoCategory(descriptor));
      }

      if (!this.state.fetchCategories[Constants.FEATURED_CHANNELS]) {
        this.fetchContentsByCategory(this.getFeaturedChannelsCategory(descriptor));
      }
    }
    else {
      console.log("Error: No descriptors loaded.")
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

  getFeaturedVideoCategory(descriptor) {
    return {
      key: Constants.FEATURED_VIDEOS,
      value: 'Featured Videos',
      viewAll: false,
      order: 0,
      query: {
        'bool': {
          'filter': [
            {
              'bool': {
                'should': [
                  {
                    'match': {
                      'content-type': '/component/youtube-video'
                    }
                  },
                  {
                    'match': {
                      'content-type': '/component/video-on-demand'
                    }
                  }
                ],
              }
            },
            {
              'match': {
                'featured_b': true
              }
            }
          ]
        }
      },
      numResults: descriptor.page.maxVideosDisplay_i
    };
  }

  getLatestVideoCategory(descriptor) {
    return {
      key: Constants.LATEST_VIDEOS,
      value: 'Latest Videos',
      viewAll: false,
      order: 1,
      query: {
        'bool': {
          'filter': [
            {
              'bool': {
                'should': [
                  {
                    'match': {
                      'content-type': '/component/youtube-video'
                    }
                  },
                  {
                    'match': {
                      'content-type': '/component/video-on-demand'
                    }
                  }
                ]
              }
            }
          ]
        },
      },
      sort: {
        by: 'date_dt',
        order: 'desc'
      },
      numResults: descriptor.page.maxVideosDisplay_i
    };
  }

  getFeaturedChannelsCategory(descriptor) {
    return {
      key: Constants.FEATURED_CHANNELS,
      value: 'Featured Channels',
      type: 'channel-card-alt',
      order: 2,
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
      },
      numResults: descriptor.page.maxChannelsDisplay_i
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

  renderHomeContent(descriptor) {
    const shouldShowCats = CATEGORIES_KEYS.every(key => this.state.fetchCategories[key]);

    return (
      <div>
        {this.renderSlider(descriptor)}
        { shouldShowCats && (
          <VideoCategories categories={this.buildCategories()} />
        )}
      </div>
    );
  }

  render() {
    var { descriptors } = this.props;

    return (
      <div>
        { descriptors && descriptors[this.descriptorUrl] &&
          this.renderHomeContent(descriptors[this.descriptorUrl])
        }
      </div>
    );
  }
}

function mapStateToProps(store) {
  return {
    videoStatus: store.video.videoStatus,
    descriptors: store.craftercms.descriptors.entries
  };
}

function mapDispatchToProps(dispatch) {
  return ({
    setVideoDocked: (docked) => {
      dispatch(setVideoDocked(docked));
    },
    getDescriptor: (url) => {
      dispatch(getDescriptor(url));
    },
    setHeaderGhost: (ghost) => {
      dispatch(setHeaderGhost(ghost));
    }
  });
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
