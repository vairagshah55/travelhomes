import { useNavigate } from "react-router-dom";
import { SlArrowLeft } from "react-icons/sl";
import { getImageUrl } from "@/lib/utils";

interface AvatarUploadProps {
  photoPreview: string | null;
  userPhoto?: string;
  userName?: string;
  onFileChange: (file: File | null) => void;
}

const AvatarUpload = ({ photoPreview, userPhoto, userName, onFileChange }: AvatarUploadProps) => {
  const navigate = useNavigate();
  return (
    <div className="text-center mb-9">
      <div className="relative inline-block mb-3">
        <img
          src={photoPreview || (userPhoto ? getImageUrl(userPhoto) : "/user-avatar.svg")}
          onError={(e) => { e.currentTarget.src = "/user-avatar.svg"; }}
          alt={`${userName}'s avatar`}
          className="w-full h-full object-cover bg-white rounded-full"
        />

        {/* Edit overlay — triggers file input */}
        <label className="absolute bottom-2 right-2 w-7 h-7 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/70 transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          />
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 30 30">
            <path
              d="M14.333 8.33325H12.9997C9.66634 8.33325 8.33301 9.66659 8.33301 12.9999V16.9999C8.33301 20.3333 9.66634 21.6666 12.9997 21.6666H16.9997C20.333 21.6666 21.6663 20.3333 21.6663 16.9999V15.6666"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
            <path
              d="M17.6933 9.0135L12.4399 14.2668C12.2399 14.4668 12.0399 14.8602 11.9999 15.1468L11.7133 17.1535C11.6066 17.8802 12.1199 18.3868 12.8466 18.2868L14.8533 18.0002C15.1333 17.9602 15.5266 17.7602 15.7333 17.5602L20.9866 12.3068C21.8933 11.4002 22.3199 10.3468 20.9866 9.0135C19.6533 7.68017 18.5999 8.10684 17.6933 9.0135Z"
              stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"
            />
            <path
              d="M16.9395 9.76685C17.3861 11.3602 18.6328 12.6068 20.2328 13.0602"
              stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </label>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="top-8 left-0 absolute flex items-center gap-1 ml-24 max-md:ml-4 mt-24"
      >
        <SlArrowLeft size={12} />
        <span className="text-sm">Back</span>
      </button>

      <h2 className="text-xl font-bold font-geist">Upload a Photo</h2>
    </div>
  );
};

export default AvatarUpload;
