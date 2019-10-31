/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import cx from 'classnames';
import { orderBy, groupBy } from 'lodash';
import moment from 'moment';
import Moment from 'react-moment';

import manifest from '../../../utils/manifest';
import ObservedImage from '../../ObservedImage';
import { Button, DestinyKey } from '../../UI/Button';
import MemberLink from '../../MemberLink';
import * as bungie from '../../../utils/bungie';

import './styles.css';

class PGCR extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: [],
      playerCache: []
    };
  }

  expandHandler = instanceId => {
    this.setState((prevState, props) => {
      let index = prevState.expanded.find(e => e.instanceId === instanceId);
      if (!index) {
        let expanded = prevState.expanded.concat({ instanceId, expandedPlayers: [] });
        return { expanded: expanded };
      }
    });

    this.updatePlayerCache(instanceId);
  };

  contractHandler = instanceId => {
    this.setState((prevState, props) => {
      let index = prevState.expanded.find(e => e.instanceId === instanceId);
      if (index) {
        let expanded = prevState.expanded.filter(e => e.instanceId !== instanceId);
        return { expanded: expanded };
      }
    });
  };

  updatePlayerCache = instanceId => {
    let pgcr = this.props.data.find(p => instanceId === p.activityDetails.instanceId);

    if (pgcr) {
      pgcr.entries.forEach(async e => {
        let progression = await this.getProgression(e.player.destinyUserInfo.membershipType, e.player.destinyUserInfo.membershipId);

        this.setState((state, props) => ({
          playerCache: state.playerCache.concat({
            id: e.player.destinyUserInfo.membershipType + e.player.destinyUserInfo.membershipId,
            ...progression.points,
            ...progression.resets
          })
        }));
      });
    }
  };

  getProgression = async (membershipType, membershipId) => {
    let response = await bungie.GetProfile({
      params: {
        membershipType,
        membershipId,
        components: '202,900'
      }
    });

    if (!response || (response && response.ErrorCode !== 1) || (response && response.ErrorCode === 1 && !response.Response.characterProgressions.data)) {
      return {
        points: {
          
        },
        resets: {
          
        }
      };
    }

    let gloryPoints = Object.values(response.Response.characterProgressions.data)[0].progressions[2000925172].currentProgress.toLocaleString('en-us');
    let valorPoints = Object.values(response.Response.characterProgressions.data)[0].progressions[2626549951].currentProgress.toLocaleString('en-us');
    let infamyPoints = Object.values(response.Response.characterProgressions.data)[0].progressions[2772425241].currentProgress.toLocaleString('en-us');

    let valorResets = response.Response.profileRecords.data.records[559943871] ? response.Response.profileRecords.data.records[559943871].objectives[0].progress.toLocaleString('en-us') : '0';
    let infamyResets = response.Response.profileRecords.data.records[3901785488] ? response.Response.profileRecords.data.records[3901785488].objectives[0].progress.toLocaleString('en-us') : '0';

    return {
      points: {
        gloryPoints,
        valorPoints,
        infamyPoints
      },
      resets: {
        valorResets,
        infamyResets
      }
    };
  };

  togglePlayerHandler = (instanceId, characterId) => {
    this.setState((prevState, props) => {
      let expandedIndex = prevState.expanded.findIndex(e => e.instanceId === instanceId);

      if (expandedIndex > -1) {
        let index = prevState.expanded[expandedIndex].expandedPlayers.indexOf(characterId);
        if (index > -1) {
          let expanded = prevState.expanded;
          let expandedPlayers = expanded[expandedIndex].expandedPlayers.filter(c => c !== characterId);
          expanded[expandedIndex].expandedPlayers = expandedPlayers;
          return { expanded: expanded };
        } else {
          let expanded = prevState.expanded;
          let expandedPlayers = expanded[expandedIndex].expandedPlayers.concat(characterId);
          expanded[expandedIndex].expandedPlayers = expandedPlayers;
          return { expanded: expanded };
        }
      }
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.expanded !== this.state.expanded) {
      this.props.rebindTooltips();
    }
  }

  render() {
    const { t, member, data } = this.props;
    const characters = member.data.profile.characters.data;
    const characterIds = characters.map(c => c.characterId);

    let reports = [];

    let modes = {
      crucible: [69, 70, 71, 72, 74, 73, 43, 44, 48, 60, 65, 59, 31, 37, 38],
      clash: [71, 72, 44],
      control: [73, 74, 43],
      ironBanner: [43, 44],
      supremacy: [31],
      survival: [37],
      countdown: [38],
      gambit: [63, 75],
      scoredNightfalls: [46]
    };

    data.forEach(pgcr => {
      if (reports.find(r => r.instanceId === pgcr.instanceId)) return

      const isExpanded = this.state.expanded.find(e => e.instanceId === pgcr.activityDetails.instanceId);

      if (isExpanded) console.log(pgcr);

      let definitionMode = Object.values(manifest.DestinyActivityModeDefinition).find(d => d.modeType === pgcr.activityDetails.mode);

      let definitionCompetitive = manifest.DestinyActivityDefinition[2947109551];
      let definitionQuickplay = manifest.DestinyActivityDefinition[2274172949];
      let definitionStrikes = manifest.DestinyActivityModeDefinition[2394616003];

      let modeName = definitionMode.displayProperties.name;
      modeName = definitionMode.hash === 2096553452 ? manifest.DestinyActivityDefinition[3243244011] && manifest.DestinyActivityDefinition[3243244011].displayProperties && manifest.DestinyActivityDefinition[3243244011].displayProperties.name : modeName;
      modeName = modeName.replace(': ' + definitionCompetitive.displayProperties.name, '');
      modeName = modeName.replace(': ' + definitionQuickplay.displayProperties.name, '');
      modeName = modeName.replace(definitionStrikes.displayProperties.name, '').trim();

      let map = manifest.DestinyActivityDefinition[pgcr.activityDetails.referenceId];

      let entry = pgcr.entries.find(entry => characterIds.includes(entry.characterId));

      let standing = entry.values.standing && entry.values.standing.basic.value !== undefined ? entry.values.standing.basic.value : -1;

      let scoreTotal = entry.values.score ? pgcr.entries.reduce((v, e) => v + e.values.score.basic.value, 0) : false;

      let standingImage, alphaVictory, bravoVictory;

      if (standing > -1) {
        alphaVictory = pgcr.teams.find(t => t.teamId === 17 && t.standing.basic.value === 0);
        bravoVictory = pgcr.teams.find(t => t.teamId === 18 && t.standing.basic.value === 0);

        if (modes.crucible.includes(pgcr.activityDetails.mode)) {
          standingImage = !standing ? `/static/images/extracts/ui/01E3-000004AC.PNG` : `/static/images/extracts/ui/01E3-000004B2.PNG`;
        }
        if (modes.ironBanner.includes(pgcr.activityDetails.mode)) {
          standingImage = !standing ? `/static/images/extracts/ui/0560-000006CB.PNG` : `/static/images/extracts/ui/0560-000006C8.PNG`;
        }
        if (modes.gambit.includes(pgcr.activityDetails.mode)) {
          standingImage = !standing ? `/static/images/extracts/ui/02AF-00001F1E.PNG` : `/static/images/extracts/ui/02AF-00001F1A.PNG`;
        }
      }

      let row, detail;

      let realEndTime = moment(pgcr.period).add(entry.values.activityDurationSeconds.basic.value, 'seconds');

      row = (
        <div className='basic'>
          <div className='mode'>{modeName}</div>
          <div className='map'>{map && map.displayProperties.name}</div>
          <div className='ago'>
            <Moment fromNow>{realEndTime}</Moment>
          </div>
        </div>
      );

      let displayStatsDefault = {
        header: [
          {
            key: 'opponentsDefeated',
            name: t('Kills + assists'),
            abbr: 'KA',
            type: 'value'
          },
          {
            key: 'kills',
            name: t('Kills'),
            abbr: 'K',
            type: 'value'
          },
          {
            key: 'deaths',
            name: t('Deaths'),
            abbr: 'D',
            type: 'value'
          },
          {
            key: 'killsDeathsRatio',
            name: t('K/D'),
            abbr: 'KD',
            type: 'value',
            round: true
          }
        ],
        expanded: [
          {
            key: 'common',
            name: t('Common'),
            fields: [
              {
                key: 'weapons',
                name: 'Weapons used'
              }
            ]
          },
          {
            key: 'basic',
            name: t('Basic'),
            fields: [
              {
                key: 'kills',
                name: t('Kills'),
                type: 'value'
              },
              {
                key: 'assists',
                name: t('Assists'),
                type: 'value'
              },
              {
                key: 'deaths',
                name: t('Deaths'),
                abbr: 'D',
                type: 'value'
              },
              {
                key: 'killsDeathsRatio',
                name: t('K/D'),
                type: 'value',
                round: true
              }
            ]
          },
          {
            key: 'extra',
            name: t('Extra'),
            fields: [
              {
                key: 'precisionKills',
                name: t('Precision kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsSuper',
                name: t('Super kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsGrenade',
                name: t('Grenade kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsMelee',
                name: t('Melee kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsAbility',
                name: t('Ability kills'),
                type: 'value',
                extended: true
              }
            ]
          }
        ]
      };

      let displayStatsScoredNightfallStrikes = {
        header: [
          {
            key: 'opponentsDefeated',
            name: t('Kills + assists'),
            abbr: 'KA',
            type: 'value'
          },
          {
            key: 'kills',
            name: t('Kills'),
            abbr: 'K',
            type: 'value'
          },
          {
            key: 'deaths',
            name: t('Deaths'),
            abbr: 'D',
            type: 'value'
          },
          {
            key: 'killsDeathsRatio',
            name: t('K/D'),
            abbr: 'KD',
            type: 'value',
            round: true
          },
          {
            key: 'score',
            name: t('Score'),
            abbr: 'S',
            type: 'displayValue',
            root: true
          }
        ],
        expanded: [
          {
            key: 'common',
            name: t('Common'),
            fields: [
              {
                key: 'weapons',
                name: 'Weapons used'
              }
            ]
          },
          {
            key: 'basic',
            name: t('Basic'),
            fields: [
              {
                key: 'kills',
                name: t('Kills'),
                type: 'value'
              },
              {
                key: 'assists',
                name: t('Assists'),
                type: 'value'
              },
              {
                key: 'deaths',
                name: t('Deaths'),
                abbr: 'D',
                type: 'value'
              },
              {
                key: 'killsDeathsRatio',
                name: t('K/D'),
                type: 'value',
                round: true
              },
              {
                key: 'score',
                name: t('Score'),
                abbr: 'S',
                type: 'displayValue',
                root: true
              }
            ]
          },
          {
            key: 'extra',
            name: t('Extra'),
            fields: [
              {
                key: 'precisionKills',
                name: t('Precision kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsSuper',
                name: t('Super kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsGrenade',
                name: t('Grenade kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsMelee',
                name: t('Melee kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsAbility',
                name: t('Ability kills'),
                type: 'value',
                extended: true
              }
            ]
          }
        ]
      };

      let displayStatsCrucible = {
        header: [
          {
            key: 'opponentsDefeated',
            name: t('Kills + assists'),
            abbr: 'KA',
            type: 'value'
          },
          {
            key: 'kills',
            name: t('Kills'),
            abbr: 'K',
            type: 'value'
          },
          {
            key: 'deaths',
            name: t('Deaths'),
            abbr: 'D',
            type: 'value'
          },
          {
            key: 'killsDeathsRatio',
            name: t('K/D'),
            abbr: 'KD',
            type: 'value',
            round: true
          },
          {
            key: 'gloryPoints',
            name: t('Glory points'),
            abbr: 'G',
            type: 'value',
            async: true,
            hideInline: true
          }
        ],
        expanded: [
          {
            key: 'common',
            name: t('Common'),
            fields: [
              {
                key: 'gloryPoints',
                name: t('Glory points'),
                type: 'value',
                async: true
              },
              {
                key: 'valorResets',
                name: t('Valor resets'),
                type: 'value',
                async: true
              },
              {
                key: 'weapons',
                name: 'Weapons used'
              }
            ]
          },
          {
            name: t('Basic'),
            key: 'basic',
            fields: [
              {
                key: 'kills',
                name: t('Kills'),
                type: 'value'
              },
              {
                key: 'assists',
                name: t('Assists'),
                type: 'value'
              },
              {
                key: 'deaths',
                name: t('Deaths'),
                abbr: 'D',
                type: 'value'
              },
              {
                key: 'killsDeathsRatio',
                name: t('K/D'),
                type: 'value',
                round: true
              },
              {
                key: 'allMedalsEarned',
                name: t('Medals earned'),
                type: 'value',
                extended: true
              }
            ]
          },
          {
            key: 'extra',
            name: t('Extra'),
            fields: [
              {
                key: 'precisionKills',
                name: t('Precision kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsSuper',
                name: t('Super kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsGrenade',
                name: t('Grenade kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsMelee',
                name: t('Melee kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'weaponKillsAbility',
                name: t('Ability kills'),
                type: 'value',
                extended: true
              }
            ]
          },
          {
            key: 'medals',
            name: t('Medals'),
            fields: [
              {
                key: 'medals'
              }
            ]
          }
        ]
      };

      let displayStatsGambit = {
        header: [
          {
            key: 'mobKills',
            name: t('Mob Kills'),
            abbr: 'MK',
            type: 'value',
            extended: true
          },
          {
            key: 'motesDeposited',
            name: t('Motes Deposited'),
            abbr: 'MD',
            type: 'value',
            extended: true
          },
          {
            key: 'motesLost',
            name: t('Motes Lost'),
            abbr: 'ML',
            type: 'value',
            extended: true
          },
          {
            key: 'invasionKills',
            name: t('Invasion Kills'),
            abbr: 'IK',
            type: 'value',
            extended: true
          },
          {
            key: 'blockerKills',
            name: t('Blocker Kills'),
            type: 'value',
            extended: true,
            hideInline: true
          }
        ],
        expanded: [
          {
            key: 'common',
            name: t('Common'),
            fields: [
              {
                key: 'infamyPoints',
                name: t('Infamy points'),
                type: 'value',
                async: true
              },
              {
                key: 'infamyResets',
                name: t('Infamy resets'),
                type: 'value',
                async: true
              },
              {
                key: 'weapons',
                name: 'Weapons used'
              }
            ]
          },
          {
            key: 'mobs',
            name: t('Mobs'),
            fields: [
              {
                key: 'mobKills',
                name: t('Mob Kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'highValueKills',
                name: t('High Value Killed'),
                type: 'value',
                extended: true
              },
              {
                key: 'blockerKills',
                name: t('Blocker Kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'smallBlockersSent',
                name: t('Small Blockers Sent'),
                type: 'value',
                extended: true
              },
              {
                key: 'mediumBlockersSent',
                name: t('Medium Blockers Sent'),
                type: 'value',
                extended: true
              },
              {
                key: 'largeBlockersSent',
                name: t('Large Blockers Sent'),
                type: 'value',
                extended: true
              }
            ]
          },
          {
            key: 'motes',
            name: t('Motes'),
            fields: [
              {
                key: 'motesDeposited',
                name: t('Motes Deposited'),
                type: 'value',
                extended: true
              },
              {
                key: 'motesLost',
                name: t('Motes Lost'),
                type: 'value',
                extended: true
              },
              {
                key: 'motesDenied',
                name: t('Motes Denied'),
                type: 'value',
                extended: true
              }
            ]
          },
          {
            key: 'invasion',
            name: t('Invasion'),
            fields: [
              {
                key: 'invasions',
                name: t('Invasions'),
                type: 'value',
                extended: true
              },
              {
                key: 'invasionKills',
                name: t('Invasion Kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'invasionDeaths',
                name: t('Invasion Deaths'),
                type: 'value',
                extended: true
              },
              {
                key: 'invaderKills',
                name: t('Invader Kills'),
                type: 'value',
                extended: true
              },
              {
                key: 'invaderDeaths',
                name: t('Invader Deaths'),
                type: 'value',
                extended: true
              }
            ]
          },
          {
            key: 'medals',
            name: t('Medals'),
            fields: [
              {
                key: 'medals'
              }
            ]
          }
        ]
      };

      const medalExclusions = ['precisionKills', 'weaponKillsAbility', 'weaponKillsGrenade', 'weaponKillsMelee', 'weaponKillsSuper', 'primevalHealing', 'primevalDamage', 'primevalKills', 'motesPickedUp', 'motesLost', 'motesDeposited', 'motesDenied', 'bankOverage', 'supremacyAllyKillEnemyTagsCaptured', 'supremacyAllyTagsRecovered', 'supremacyCrestsRecovered', 'supremacyCrestsSecured', 'supremacyOwnKillEnemyTagsCaptured', 'supremacyOwnTagsRecovered'];

      let displayStats;
      if (modes.gambit.includes(pgcr.activityDetails.mode)) {
        displayStats = displayStatsGambit;
      } else if (modes.crucible.includes(pgcr.activityDetails.mode)) {
        displayStats = displayStatsCrucible;
      } else if (modes.scoredNightfalls.includes(pgcr.activityDetails.mode)) {
        displayStats = displayStatsScoredNightfallStrikes;
      } else {
        displayStats = displayStatsDefault;
      }

      let entries = [];
      pgcr.entries.forEach(entry => {
        let dnf = entry.values.completed.basic.value === 0 ? true : false;
        let isExpandedPlayer = this.state.expanded.find(e => e.instanceId === pgcr.activityDetails.instanceId && e.expandedPlayers.includes(entry.characterId));

        entries.push({
          teamId: pgcr.teams && pgcr.teams.length ? entry.values.team.basic.value : null,
          fireteamId: entry.values.fireteamId ? entry.values.fireteamId.basic.value : null,
          element: (
            <li key={entry.characterId} className={cx('linked', { isExpandedPlayer })} onClick={() => this.togglePlayerHandler(pgcr.activityDetails.instanceId, entry.characterId)}>
              <div className={cx('inline', { dnf: dnf })}>
                <div className='member'>
                  <MemberLink type={entry.player.destinyUserInfo.membershipType} id={entry.player.destinyUserInfo.membershipId} displayName={entry.player.destinyUserInfo.displayName} characterId={entry.characterId} />
                </div>
                {displayStats.header.map((s, i) => {
                  let value;

                  if (s.extended) {
                    value = s.round ? Number.parseFloat(entry.extended.values[s.key].basic[s.type]).toFixed(2) : entry.extended.values[s.key].basic[s.type];
                  } else if (s.async) {
                    let playerCache = this.state.playerCache.find(c => c.id === entry.player.destinyUserInfo.membershipType + entry.player.destinyUserInfo.membershipId);
                    value = playerCache && playerCache[s.key] ? playerCache[s.key] : '–';
                  } else if (s.root) {
                    value = s.round ? Number.parseFloat(entry[s.key].basic[s.type]).toFixed(2) : entry[s.key].basic[s.type];
                  } else {
                    value = s.round ? Number.parseFloat(entry.values[s.key].basic[s.type]).toFixed(2) : entry.values[s.key].basic[s.type];
                  }

                  return (
                    <div key={i} className={cx('stat', { hideInline: s.hideInline, extended: s.extended }, s.key)}>
                      {s.expanded ? <div className='name'>{s.name}</div> : null}
                      <div className='value'>{value}</div>
                    </div>
                  );
                })}
              </div>
              <div className='expanded'>
                {displayStats.expanded.map((g, h) => {
                  return (
                    <div key={h} className={cx('group', g.key)}>
                      {g.name ? (
                        <div className='sub-header alt'>
                          <div>{g.name}</div>
                        </div>
                      ) : null}
                      {g.fields.map((s, i) => {
                        let value;
                        if (s.extended) {
                          value = s.round ? Number.parseFloat(entry.extended.values[s.key].basic[s.type]).toFixed(2) : entry.extended.values[s.key].basic[s.type].toLocaleString('en-us');
                        } else if (s.async) {
                          let playerCache = this.state.playerCache.find(c => c.id === entry.player.destinyUserInfo.membershipType + entry.player.destinyUserInfo.membershipId);
                          value = playerCache && playerCache[s.key] ? playerCache[s.key] : '–';
                        } else if (s.key === 'weapons') {
                          if (entry.extended.weapons && entry.extended.weapons.length) {
                            value = (
                              <ul>
                                {entry.extended.weapons.map((w, p) => {
                                  let definitionItem = manifest.DestinyInventoryItemDefinition[w.referenceId];
                                  let kills = w.values ? w.values.uniqueWeaponKills.basic.value : '0';
                                  return (
                                    <li key={p} className={cx('item', 'tooltip')} data-hash={definitionItem.hash} data-uninstanced='yes'>
                                      <ObservedImage className={cx('image', 'icon')} src={`https://www.bungie.net${definitionItem.displayProperties.icon}`} />
                                      <div className='value'>{kills}</div>
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          } else {
                            return null;
                          }
                        } else if (s.key === 'medals') {
                          if (entry.extended && entry.extended.values) {
                            value = (
                              <ul>
                                {Object.keys(entry.extended.values).filter(j => !medalExclusions.includes(j)).filter(j => displayStats.expanded.filter(l => l.fields.find(h => h.key === j)).length === 0).map((m) => {
                                  let medal = entry.extended.values[m];
                                  let definitionMedal = manifest.DestinyHistoricalStatsDefinition[m];

                                  if (definitionMedal) {
                                    let value = medal.basic ? medal.basic.value : '0';
                                    let icon = definitionMedal.iconImage && definitionMedal.iconImage !== '' ? definitionMedal.iconImage : manifest.settings.destiny2CoreSettings.undiscoveredCollectibleImage;

                                    return (
                                      <li key={m} className={cx('item', 'tooltip')} data-hash={m} data-table='DestinyHistoricalStatsDefinition'>
                                        <ObservedImage className={cx('image', 'icon')} src={`${!definitionMedal.localIcon ? 'https://www.bungie.net' : ''}${icon}`} />
                                        <div className='value'>{value}</div>
                                      </li>
                                    );

                                  } else {
                                    return null;
                                  }
                                })}
                              </ul>
                            );
                          } else {
                            return null;
                          }
                        } else {
                          value = s.round ? Number.parseFloat(entry.values[s.key].basic[s.type]).toFixed(2) : entry.values[s.key].basic[s.type].toLocaleString('en-us');
                        }

                        return (
                          <div key={i} className={cx('stat', { hideInline: s.hideInline }, s.key)}>
                            <div className='name'>{s.name}</div>
                            <div className='value'>{value}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </li>
          )
        });
      });

      let alpha = pgcr.teams && pgcr.teams.length ? pgcr.teams.find(t => t.teamId === 17) : false;
      let bravo = pgcr.teams && pgcr.teams.length ? pgcr.teams.find(t => t.teamId === 18) : false;
      let score;
      if (pgcr.teams && pgcr.teams.length && alpha && bravo) {
        score = (
          <>
            <div className={cx('value', 'alpha', { victory: alphaVictory })}>{alpha.score.basic.displayValue}</div>
            <div className={cx('value', 'bravo', { victory: bravoVictory })}>{bravo.score.basic.displayValue}</div>
          </>
        );
      }

      detail = (
        <>
          <div className='head'>
            {map && map.pgcrImage && <ObservedImage className='image bg' src={`https://www.bungie.net${map.pgcrImage}`} />}
            <div className='detail'>
              <div>
                <div className='mode'>{modeName}</div>
                <div className='map'>{map && map.displayProperties.name}</div>
              </div>
              <div>
                <div className='duration'>{entry.values.activityDurationSeconds.basic.displayValue}</div>
                <div className='ago'>
                  <Moment fromNow>{realEndTime}</Moment>
                </div>
              </div>
            </div>
            {standing > -1 ? (
              <>
                <div className='standing'>
                  {standingImage ? <ObservedImage className='image' src={standingImage} /> : null}
                  <div className='text'>{standing === 0 ? t('VICTORY') : t('DEFEAT')}</div>
                </div>
                <div className='score teams'>{score}</div>
              </>
            ) : null}
            {scoreTotal && standing < 0 ? (
              <>
                <div className='score'>{scoreTotal.toLocaleString('en-us')}</div>
              </>
            ) : null}
          </div>
          <div className='entries'>
            {pgcr.teams && pgcr.teams.length ? (
              orderBy(pgcr.teams, [t => t.score.basic.value], ['desc']).map(team => {
                let fireteams = Object.values(groupBy(entries.filter(e => e.teamId === team.teamId), 'fireteamId'));

                return (
                  <ul key={team.teamId} className='team'>
                    <li className={cx('team-head', (team.teamId === 17 ? t('Alpha') : t('Bravo')).toLowerCase())}>
                      <div className='team name'>{team.teamId === 17 ? t('Alpha') : t('Bravo')} team</div>
                      {displayStats.header.map((s, i) => {
                        return (
                          <div key={i} className={cx(s.key, { hideInline: s.hideInline })}>
                            <div className='full'>{s.name}</div>
                            <div className='abbr'>{s.abbr}</div>
                          </div>
                        );
                      })}
                      <div className='team score hideInline'>{team.score.basic.displayValue}</div>
                    </li>
                    {fireteams.map((f, i) => {
                      return (
                        <li key={i}>
                          <ul className={cx('list', 'fireteam', { stacked: f.length > 1 })}>{f.map(e => e.element)}</ul>
                        </li>
                      );
                    })}
                  </ul>
                );
              })
            ) : (
              <ul className='team'>
                <li className={cx('team-head')}>
                  <div className='team name' />
                  {displayStats.header.map((s, i) => {
                    return (
                      <div key={i} className={cx(s.key, { hideInline: s.hideInline })}>
                        <div className='full'>{s.name}</div>
                        <div className='abbr'>{s.abbr}</div>
                      </div>
                    );
                  })}
                  <div className='team score hideInline' />
                </li>
                {Object.values(groupBy(entries, 'fireteamId')).map((f, i) => {
                  return (
                    <li key={i}>
                      <ul className={cx('list', 'fireteam', { stacked: f.length > 1 })}>{f.map(e => e.element)}</ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className='sticky-nav inline'>
            <div className='wrapper'>
              <div />
              <ul>
                <li>
                  <Button action={() => this.contractHandler(pgcr.activityDetails.instanceId)}>
                    <DestinyKey type='dismiss' />
                    {t('Close')}
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </>
      );

      reports.push({
        instanceId: pgcr.instanceId,
        element: (
          <li key={pgcr.activityDetails.instanceId} className={cx('linked', { isExpanded: isExpanded, standing: standing > -1, victory: standing === 0 })} onClick={() => (!isExpanded ? this.expandHandler(pgcr.activityDetails.instanceId) : false)}>
            {!isExpanded ? row : detail}
          </li>
        )
      });
    });

    return <ul className='list reports'>{reports.slice().map(r => r.element)}</ul>;
  }
}

function mapStateToProps(state, ownProps) {
  return {
    member: state.member,
    viewport: state.viewport
  };
}

function mapDispatchToProps(dispatch) {
  return {
    rebindTooltips: value => {
      dispatch({ type: 'REBIND_TOOLTIPS', payload: new Date().getTime() });
    }
  };
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withTranslation()
)(PGCR);
