import React, { Component } from 'react';
import { connect } from 'react-redux';

import VideoCategories from '../../components/VideoCategories/VideoCategories';
import { setVideoDocked } from '../../actions/videoPlayerActions';

import { searchByCategory } from '../../libraries/search';
import { Constants } from '../../libraries/constants';

const CATEGORIES_KEYS = [Constants.ACTIVE_EVENTS, Constants.UPCOMING_EVENTS, Constants.PAST_EVENTS];

class LiveEvents extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchId: this.props.match.params.query,
      fetchCategories: {}
    };
  }

  componentWillMount() {
    this.props.setVideoDocked(false);
    this.fetchContents();
  }

  fetchContents() {
    if (!this.state.fetchCategories[Constants.ACTIVE_EVENTS]) {
      this.fetchContentsByCategory(this.getActiveEventsCategory());
    }

    if (!this.state.fetchCategories[Constants.UPCOMING_EVENTS]) {
      this.fetchContentsByCategory(this.getUpcomingEventsCategory());
    }

    if (!this.state.fetchCategories[Constants.PAST_EVENTS]) {
      this.fetchContentsByCategory(this.getLastEventsCategory());
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

  getActiveEventsCategory() {
    return {
      key: Constants.ACTIVE_EVENTS,
      value: 'Active Events',
      type: 'live-event-item',
      query: {
        'bool': {
          'filter': [
            {
              'match': {
                'content-type': '/component/stream'
              }
            },
            {
              'range': {
                'startDate_dt': {
                  'lt': 'now'
                }
              }
            },
            {
              'range': {
                'endDate_dt': {
                  'gt': 'now'
                }
              }
            }
          ]
        }
      },
      sort: {
        by: 'startDate_dt',
        order: 'asc',
        unmapped_type: 'date'
      },
      numResults: 6
    };
  }

  getUpcomingEventsCategory() {
    return {
      key: Constants.UPCOMING_EVENTS,
      value: 'Upcoming Events',
      type: 'live-event-item',
      query: {
        'bool': {
          'filter': [
            {
              'match': {
                'content-type': '/component/stream'
              }
            },
            {
              'range': {
                'startDate_dt': {
                  'gt': 'now'
                }
              }
            }
          ]
        }
      },
      sort: {
        by: 'startDate_dt',
        order: 'asc',
        unmapped_type: 'date'
      },
      numResults: 6
    };
  }

  getLastEventsCategory() {
    return {
      key: Constants.PAST_EVENTS,
      value: 'Past Events',
      type: 'live-event-item',
      noLinks: true,
      query: {
        'bool': {
          'filter': [
            {
              'match': {
                'content-type': '/component/stream'
              }
            },
            {
              'range': {
                'endDate_dt': {
                  'lt': 'now'
                }
              }
            }
          ]
        }
      },
      sort: {
        by: 'endDate_dt',
        order: 'desc',
        unmapped_type: 'date'
      },
      numResults: 6
    };
  }

  render() {
    const shouldShowCats = CATEGORIES_KEYS.every(key => this.state.fetchCategories[key]);
    return (
      <>
        { shouldShowCats && (
          <div>
            { this.buildCategories().length > 0 ?
                (
                  <VideoCategories categories={this.buildCategories()} />
                )
                :
                (
                  <div className="segment">
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '3rem',
                        fontWeight: '700',
                        padding: '15rem 0px 25rem',
                        minHeight: '50vh'
                      }}
                    >
                      Coming soon
                    </div>
                   </div>
                )
            }
          </div>
        )}
      </>
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

export default connect(mapStateToProps, mapDispatchToProps)(LiveEvents);
