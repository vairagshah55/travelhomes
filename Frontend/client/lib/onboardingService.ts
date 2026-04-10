
const ACTIVITY_ID_KEY = 'activityOnboardingId';
const CARAVAN_ID_KEY = 'caravanOnboardingId';
const STAY_ID_KEY = 'stayOnboardingId';

export type OnboardingType = 'activity' | 'caravan' | 'stay';

export const onboardingService = {
  setActivityId: (id: string) => sessionStorage.setItem(ACTIVITY_ID_KEY, id),
  setCaravanId: (id: string) => sessionStorage.setItem(CARAVAN_ID_KEY, id),
  setStayId: (id: string) => sessionStorage.setItem(STAY_ID_KEY, id),

  getActivityId: () => sessionStorage.getItem(ACTIVITY_ID_KEY),
  getCaravanId: () => sessionStorage.getItem(CARAVAN_ID_KEY),
  getStayId: () => sessionStorage.getItem(STAY_ID_KEY),

  getAnyId: (): { type: OnboardingType; id: string } | null => {
    const activityId = sessionStorage.getItem(ACTIVITY_ID_KEY);
    if (activityId && activityId !== 'null' && activityId !== 'undefined') return { type: 'activity', id: activityId };

    const caravanId = sessionStorage.getItem(CARAVAN_ID_KEY);
    if (caravanId && caravanId !== 'null' && caravanId !== 'undefined') return { type: 'caravan', id: caravanId };

    const stayId = sessionStorage.getItem(STAY_ID_KEY);
    if (stayId && stayId !== 'null' && stayId !== 'undefined') return { type: 'stay', id: stayId };
    
    return null;
  },

  clearAll: () => {
    sessionStorage.removeItem(ACTIVITY_ID_KEY);
    sessionStorage.removeItem(CARAVAN_ID_KEY);
    sessionStorage.removeItem(STAY_ID_KEY);
    sessionStorage.removeItem('onboardingId');
    sessionStorage.removeItem('onboardingType');
    sessionStorage.removeItem('id');
  }
};
