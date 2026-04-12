export type CountryOption = {
  isoCode: string;
  name: string;
  countryCode?: string;
  dialCode?: string;
};

export interface DiscountOffer {
  enabled: boolean;
  type: string;
  value: string;
  finalPrice: string;
}

export const DropdownArrowSvg = () => (
  <svg
    className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
    viewBox="0 0 18 18"
    fill="none"
  >
    <path
      d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
      stroke="#292D32"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SmallDropdownArrowSvg = () => (
  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="#131313" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const UploadPlusSvg = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.125 9H16.875" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 16.875L9 1.125" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
