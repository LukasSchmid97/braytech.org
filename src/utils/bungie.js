import * as ls from './localStorage';

// Bungie API access convenience methods

class BungieError extends Error {
  constructor(request) {
    super(request.Message);

    this.errorCode = request.ErrorCode;
    this.errorStatus = request.ErrorStatus;
  }
}

async function apiRequest(path, options = {}) {
  const defaults = {
    headers: {},
    stats: false,
    auth: false
  };
  const stats = options.stats || false;
  options = { ...defaults, ...options };

  options.headers['X-API-Key'] = process.env.REACT_APP_BUNGIE_API_KEY;

  if (typeof options.body === 'string') {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const request = await fetch(`https://${stats ? 'stats' : 'www'}.bungie.net${path}`, options);
  const response = await request.json();

  if (request.ok && response.ErrorCode && response.ErrorCode !== 1) {
    throw new BungieError(response);
  } else if (request.ok) {
    if (path === '/Platform/App/OAuth/Token/') {
      let now = new Date().getTime();
      const tokens = { 
        access: {
          value: response.access_token,
          expires: now + (response.expires_in * 1000)
        },
        refresh: {
          value: response.refresh_token,
          expires: now + (response.refresh_expires_in * 1000)
        },
        bnetMembershipId: response.membership_id
      };
      ls.set('setting.auth', tokens);
      return response;
    } else {
      return response.Response;
    }    
  } else {
    console.log(request);
  }
}

export const GetDestinyManifest = async () => apiRequest('/Platform/Destiny2/Manifest/');

export const GetCommonSettings = async () => apiRequest(`/Platform/Settings/`);

export const GetPublicMilestones = async () => apiRequest('/Platform/Destiny2/Milestones/');

export const GetOAuthAccessToken = async body =>
  apiRequest('/Platform/App/OAuth/Token/', {
    method: 'post',
    headers: {
      Authorization: `Basic ${window.btoa(`${process.env.REACT_APP_BUNGIE_CLIENT_ID}:${process.env.REACT_APP_BUNGIE_CLIENT_SECRET}`)}`
    },
    body
  });

export const manifest = async version => fetch(`https://www.bungie.net${version}`).then(a => a.json());

export const GetProfile = async (membershipType, membershipId, components) => apiRequest(`/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components}`);

export const GetGroupsForMember = async (membershipType, membershipId) => apiRequest(`/Platform/GroupV2/User/${membershipType}/${membershipId}/0/1/`);

export const GetGroupByName = async (groupName, groupType = 1) => apiRequest(`/Platform/GroupV2/Name/${encodeURIComponent(groupName)}/${groupType}/`);

export const GetMembersOfGroup = async groupId => apiRequest(`/Platform/GroupV2/${groupId}/Members/`);

export const GetGroup = async groupId => apiRequest(`/Platform/GroupV2/${groupId}/`);

export const GetClanWeeklyRewardState = async groupId => apiRequest(`/Platform/Destiny2/Clan/${groupId}/WeeklyRewardState/`);

export const GetHistoricalStats = async (membershipType, membershipId, characterId = '0', groups, modes, periodType) => apiRequest(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/0/Stats/?groups=${groups}&modes=${modes}&periodType=${periodType}`);

export const SearchDestinyPlayer = async (membershipType, displayName) => apiRequest(`/Platform/Destiny2/SearchDestinyPlayer/${membershipType}/${encodeURIComponent(displayName)}/`);

export const GetActivityHistory = async (membershipType, membershipId, characterId, count, mode = false, page) => apiRequest(`/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?page=${page}${mode ? `&mode=${mode}` : ''}&count=${count}`);

export const PGCR = async id => apiRequest(`/Platform/Destiny2/Stats/PostGameCarnageReport/${id}/`, { stats: true });
