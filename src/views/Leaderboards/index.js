import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withNamespaces } from 'react-i18next';
import cx from 'classnames';

import './styles.css';

import Root from './Root/';
import Board from './Board/';

class Leaderboards extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    
  }

  render() {
    const { t, member } = this.props;
    const view = this.props.match.params.view || false;
    const dom = this.props.match.params.dom || false;
    const sub = this.props.match.params.sub || false;

    if (view === 'for') {
      return <Board dom={dom} sub={sub} />;
    } else if (view === 'gambit') {
      
    } else {
      return <Root />;
    }
  }
}

function mapStateToProps(state, ownProps) {
  return {
    member: state.member,
    PGCRcache: state.PGCRcache
  };
}

export default compose(
  connect(mapStateToProps),
  withNamespaces()
)(Leaderboards);
