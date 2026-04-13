interface ProfileFieldProps {
  label: string;
  value?: string | null;
}

const ProfileField = ({ label, value }: ProfileFieldProps) => (
  <div>
    <label className="block text-base font-semibold dark:bg-black dark:text-white text-gray-700 font-plus-jakarta mb-2">
      {label}
    </label>
    <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
      {value || ""}
    </p>
  </div>
);

export default ProfileField;
