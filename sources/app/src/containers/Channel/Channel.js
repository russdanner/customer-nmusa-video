import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getDescriptor } from '@craftercms/redux';
import { parseDescriptor } from '@craftercms/content';
import { ExperienceBuilder } from '@craftercms/experience-builder/react';

import { setVideoDocked } from '../../actions/videoPlayerActions';
import { setHeaderGhost } from '../../actions/headerActions';
import Hero from '../../components/Hero/Hero';
import VideoCategories from '../../components/VideoCategories/VideoCategories';
import NotFound from '../Errors/404';

import { nou } from '../../utils';
import { searchByCategory } from '../../libraries/search';
import { Constants } from '../../libraries/constants';
import { isAuthoring } from '../../components/utils';

const CATEGORIES_KEYS = [Constants.FEATURED_VIDEOS, Constants.LATEST_VIDEOS, Constants.RELATED_CHANNELS];

class Channel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fetchCategories: {},
    };

    //categories = new/featured, all videos, all streams, related

    this.getChannelInfo(props);
  }

  componentWillMount() {
    this.props.setVideoDocked(false);
  }

  componentDidMount() {
    // this.props.setHeaderGhost(true);
    this.fetchContents(this.props);
  }

  componentWillUnmount() {
    this.props.setHeaderGhost(false);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.match.url !== newProps.match.url) {
      this.getChannelInfo(newProps);
      this.setState({ fetchCategories: {} });
    }

    this.fetchContents(newProps);
  }

  getChannelInfo(props) {
    var channelName = props.match.params.name;

    this.descriptorUrl = `/site/components/channel/${channelName}.xml`;

    if (nou(this.props.descriptors[this.descriptorUrl])) {
      this.props.getDescriptor(this.descriptorUrl);
    }
  }

  fetchContents(props) {
    const { descriptors } = props;
    if (descriptors && descriptors[this.descriptorUrl]) {
      const descriptor = descriptors[this.descriptorUrl];
      this.fetchContentsByCategory(this.getFeaturedVideoCategory(descriptor));
      this.fetchContentsByCategory(this.getLatestVideoCategory(descriptor));
      this.fetchContentsByCategory(this.getRelatedChannels(descriptor));
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
                  },
                  {
                    'match': {
                      'content-type': '/component/stream'
                    }
                  }
                ]
              }
            },
            {
              'match': {
                'channels_o.item.key': descriptor.component.channelKey_s
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
      sort: {
        by: 'date_dt',
        order: 'desc'
      },
      numResults: descriptor.component.maxVideosDisplay_i,
      viewAll: descriptor.component.channelKey_s
    };
  }

  getLatestVideoCategory(descriptor) {
    return {
      key: Constants.LATEST_VIDEOS,
      value: 'Latest Videos',
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
                  },
                  {
                    'match': {
                      'content-type': '/component/stream'
                    }
                  }
                ]
              }
            },
            {
              'match': {
                'channels_o.item.key': descriptor.component.channelKey_s
              }
            }
          ]
        }
      },
      sort: {
        by: 'date_dt',
        order: 'desc'
      },
      numResults: descriptor.component.maxVideosDisplay_i,
      viewAll: descriptor.component.channelKey_s
    };
  }

  getRelatedChannels(descriptor) {
    return {
      key: Constants.RELATED_CHANNELS,
      value: 'Related Channels',
      type: 'channel-card-alt',   //TO RENDER CHANNEL CARD STYLING
      query: {
        'bool': {
          'must_not': {
            'term': { 'file-name': descriptor.component['file-name'] }
          },
          'filter': [
            {
              'match': {
                'content-type': '/component/component-channel'
              }
            }
          ]
        }
      },
      numResults: descriptor.component.maxChannelsDisplay_i
    };
  }

  buildCategories() {
    const { fetchCategories } = this.state;
    const categories = [];
    // If there is no featured videos, try showing latest videos
    if (fetchCategories[Constants.FEATURED_VIDEOS].hits && fetchCategories[Constants.FEATURED_VIDEOS].hits.length > 0) {
      categories.push(fetchCategories[Constants.FEATURED_VIDEOS]);
    } else {
      categories.push(fetchCategories[Constants.LATEST_VIDEOS]);
    }
    categories.push(fetchCategories[Constants.RELATED_CHANNELS]);

    return categories;
  }

  renderChannelContent(descriptor) {
    const channelHero = [];
    const channelContent = descriptor.component;
    const model = parseDescriptor(channelContent);

    channelHero.push({
      url_s: '#',
      background_s: channelContent.heroImage_s,
      title_t: channelContent['internal-name'],
      subtitle_s: channelContent.description_s
    });

    const shouldShowCats = CATEGORIES_KEYS.every(key => this.state.fetchCategories[key]);

    return (
      <ExperienceBuilder
        isAuthoring={isAuthoring()}
        path={this.descriptorUrl}
      >
        <Hero
          model={model}
          data={channelHero}
          localData={true}
        >
        </Hero>
        {shouldShowCats && (
          <VideoCategories categories={this.buildCategories()} />
        )}
      </ExperienceBuilder>
    );
  }

  render() {
    const { descriptors, descriptorsLoading } = this.props;

    if ((descriptorsLoading[this.descriptorUrl] === false) && nou(descriptors[this.descriptorUrl])) {
      return (
        <NotFound />
      );
    } else {
      return (
        <div>
          {descriptors && descriptors[this.descriptorUrl] &&
          this.renderChannelContent(descriptors[this.descriptorUrl])
          }
        </div>
      );
    }
  }
}

function mapStateToProps(store) {
  return {
    videoInfo: store.video.videoInfo,
    videoStatus: store.video.videoStatus,
    descriptors: store.craftercms.descriptors.entries,
    descriptorsLoading: store.craftercms.descriptors.loading
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

export default connect(mapStateToProps, mapDispatchToProps)(Channel);
