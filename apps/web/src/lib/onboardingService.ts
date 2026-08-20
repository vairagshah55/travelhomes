const ACTIVITY_ID_KEY = 'activityOnboardingId';
const CARAVAN_ID_KEY = 'caravanOnboardingId';
const STAY_ID_KEY = 'stayOnboardingId';
const VEHICLE_ID_KEY = 'vehicleOnboardingId';

export type OnboardingType = 'activity' | 'caravan' | 'stay' | 'vehicle';

const readId = (key: string) => {
  const value = sessionStorage.getItem(key);
  return value && value !== 'null' && value !== 'undefined' ? value : null;
};

export const onboardingService = {
  setActivityId: (id: string) => sessionStorage.setItem(ACTIVITY_ID_KEY, id),
  setCaravanId: (id: string) => sessionStorage.setItem(CARAVAN_ID_KEY, id),
  setStayId: (id: string) => sessionStorage.setItem(STAY_ID_KEY, id),
  setVehicleId: (id: string) => sessionStorage.setItem(VEHICLE_ID_KEY, id),

  getActivityId: () => sessionStorage.getItem(ACTIVITY_ID_KEY),
  getCaravanId: () => sessionStorage.getItem(CARAVAN_ID_KEY),
  getStayId: () => sessionStorage.getItem(STAY_ID_KEY),
  getVehicleId: () => sessionStorage.getItem(VEHICLE_ID_KEY),

  getAnyId: (): { type: OnboardingType; id: string } | null => {
    const candidates: [OnboardingType, string][] = [
      ['activity', ACTIVITY_ID_KEY],
      ['caravan', CARAVAN_ID_KEY],
      ['stay', STAY_ID_KEY],
      ['vehicle', VEHICLE_ID_KEY],
    ];
    for (const [type, key] of candidates) {
      const id = readId(key);
      if (id) return { type, id };
    }
    return null;
  },

  clearAll: () => {
    sessionStorage.removeItem(ACTIVITY_ID_KEY);
    sessionStorage.removeItem(CARAVAN_ID_KEY);
    sessionStorage.removeItem(STAY_ID_KEY);
    sessionStorage.removeItem(VEHICLE_ID_KEY);
    sessionStorage.removeItem('onboardingId');
    sessionStorage.removeItem('onboardingType');
    sessionStorage.removeItem('id');
  }
};
