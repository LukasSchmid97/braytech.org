import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import manifest from '../../../../utils/manifest';
import * as ls from '../../../../utils/localStorage';
import ObservedImage from '../../../../components/ObservedImage';
import Spinner from '../../../../components/UI/Spinner';
import { NoAuth, DiffProfile } from '../../../../components/BungieAuth';

import './styles.css';

class SeasonalArtifact extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.auth = ls.get('setting.auth');
  }

  render() {
    const { t, member } = this.props;
    
    if (!this.auth) {
      return <NoAuth inline />;
    }

    if (this.auth && !this.auth.destinyMemberships.find(m => m.membershipId === member.membershipId)) {
      return <DiffProfile inline />;
    }

    const definitionBucketArtifact = manifest.DestinyInventoryBucketDefinition[1506418338];

    if (this.auth && this.auth.destinyMemberships.find(m => m.membershipId === member.membershipId) && !member.data.profile.profileInventory) {
      return (
        <>
          <div className='module-header'>
            <div className='sub-name'>{definitionBucketArtifact.displayProperties.name}</div>
          </div>
          <Spinner />
        </>
      );
    }

    return (
      <>
        {/* <ObservedImage className='image artifact' src='/static/images/extracts/flair/VEye.png' /> */}
        <div className='module-header'>
          <div className='sub-name'>{definitionBucketArtifact.displayProperties.name}</div>
        </div>
        
      </>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    member: state.member
  };
}

export default compose(
  connect(
    mapStateToProps
  ),
  withTranslation()
)(SeasonalArtifact);
