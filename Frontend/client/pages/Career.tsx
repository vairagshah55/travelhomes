import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SearchIcon } from 'lucide-react';
import { SlArrowDown } from 'react-icons/sl';
import { useNavigate } from 'react-router-dom';
import { cmsPublicApi } from '@/lib/api';
import { Loader } from '@/components/ui/Loader';

type Job = { id: string; position: string; experience?: string; location?: string; jd: string; };

// Jobs will be fetched from API
const staticJobs: Job[] = [];

const values = [
  { title: 'Customer Obsession', description: 'We put customers first.' },
  { title: 'Innovation', description: 'We embrace new ideas.' },
  { title: 'Ownership', description: 'We act like owners.' },
  { title: 'Teamwork', description: 'We win together.' },
];


const tags = ['Full-time', 'Part-time', 'Remote', 'On-site'];

const Career = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(staticJobs);
  const [submitting, setSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);
const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const data = await cmsPublicApi.listJobs(true);
        console.log('[Career] Fetched data:', data);
        // Accept array directly or {data: []}
        const rawList = Array.isArray(data) ? data : (data?.data ?? []);
        const list = rawList.map((j: any) => ({
          ...j,
          id: j.id || j._id,
          position: j.position || j.jobTitle || 'Position Not Specified',
          jd: j.jd || j.jobDescription || j.description || 'No description provided.',
          location: j.location || j.jobType || 'Remote',
          experience: j.experience || j.experienceRequired || 'Not specified'
        }));
        console.log('[Career] Normalized jobs:', list);
        setJobs(list);
      } catch (e) {
        console.warn('Failed to load jobs', e);
      }
    })();
  }, []);

  const handleOpenApply = (job?: Job) => {
    setSelectedJob(job ?? null);
    setShowModal(true);
  };

  const handleOpenDetails = (job: Job) => {
    setSelectedJobForDetails(job);
    setShowDetailsModal(true);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (selectedJob) {
      fd.set('jobId', selectedJob.id);
      fd.set('jobTitle', selectedJob.position);
    }
    try {
      setSubmitting(true);
      const data = await cmsPublicApi.applyJob(fd);
      if (data?.success === false) throw new Error(data?.error || 'Failed');
      toast.success('Application submitted successfully', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
      setShowModal(false);
      form.reset();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };
  useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex-col flex gap-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <Header variant="transparent" className="fixed w-full z-50" />


      {loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
                     Fetching career details...
          </p>
        </div>
      </div>
    )
  }
      {/* Hero Section */}
      <section className="w-full mt-20 relative h-[300px] md:h-[350px] ">
        <img
          src="/career.jpg"
          alt="Career Banner"
          className="w-full h-full object-cover"
        />
        <div className="gap-6 absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-3xl md:text-5xl font-semibold">Build Your Future With Us</h1>
          <p className="max-w-2xl text-sm md:text-base">
            Join a team where passion meets purpose. We’re more than just a workplace—we’re a
            community driven by innovation, collaboration, and a shared vision to make a difference.
          </p>
          <div className="flex items-center rounded-full py-1 px-6 bg-white text-black border outline-none w-full max-w-md">
            <input
              type="text"
              placeholder="Search jobs..."
              className="flex-grow bg-transparent outline-none text-sm"
            />
            <div className="flex items-center justify-center bg-black rounded-full h-8 w-8 cursor-pointer">
              <SearchIcon className="text-white h-3 w-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Job */}
      <section className="px-4 md:px-10 py-4 dark:bg-black dark:text-white">
        <div className=" max-w-7xl mx-auto items-cente flex flex-col dark:bg-black dark:text-white dark:border-slate-300 md:flex-row md:items-center md:justify-between border rounded-xl p-6 gap-4 shadow-sm bg-gray-50">
          <div className="flex-1">
            {jobs.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold dark:bg-black dark:text-white">{jobs[0].position}</h2>
                <p className="text-sm text-gray-700 dark:bg-black dark:text-white mt-2">
                  {jobs[0].jd?.length > 160 ? jobs[0].jd.slice(0, 160) + '...' : jobs[0].jd}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold dark:bg-black dark:text-white">Explore Roles</h2>
                <p className="text-sm text-gray-700 dark:bg-black dark:text-white mt-2">We’ll post open roles here. Check back soon!</p>
              </>
            )}
          </div>
          {jobs[0] && (
            <button onClick={() => handleOpenDetails(jobs[0])} className="flex items-center border border-gray-400 rounded-full text-sm py-2 px-4 hover:bg-gray-100 dark:hover:bg-slate-600  transition whitespace-nowrap">
              View More <SlArrowDown className="ml-2 h-3 w-3" />
            </button>
          )}
        </div>
      </section>

      {/* Tags & Apply */}
      <section className="px-4 md:px-10 py-6 dark:bg-black dark:text-white">
        <div className=" max-w-7xl mx-auto items-cente flex flex-wrap gap-3 items-center">
          <span className="font-medium text-gray-700">Tags:</span>
          {tags.map((tag) => (
            <button
              key={tag}
              className="border border-gray-300 text-sm px-4 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-500"
            >
              
              {tag}
            </button>
          ))}
          {/* <button
            onClick={() => handleOpenApply()}
            className="ml-auto bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded-full text-sm"
          >
            Apply
          </button> */}
        </div>
      </section>

      {/* Job Openings */}
      <section className="px-4 md:px-10 py-12 bg-gray-100 dark:bg-black dark:text-white">
       <div className=" max-w-7xl mx-auto items-center">
         <h2 className="text-2xl font-bold mb-8">Job Openings</h2>
        <div className="space-y-6">
          {jobs.map((job) => {
            const long = (job.jd || '').length > 200;
            const content = !long ? job.jd : `${job.jd.slice(0, 200)}...`;
            return (
              <div
                key={job.id}
                className="border-b p-6 hover:bg-gray-100 dark:hover:bg-slate-500 dark:bg-black dark:text-white flex flex-col md:flex-row items-start md:items-center justify-between"
              >
                <div className="flex-1 pr-4">
                  <h3 className="text-lg font-medium">{job.position}</h3>
                <p className="text-sm text-gray-600 mt-1 w-full dark:text-white whitespace-pre-line">
  {content}
</p>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <button onClick={() => handleOpenDetails(job)} className="px-5 py-2 bg-white dark:bg-black dark:text-white text-black text-sm rounded-full border border-gray-400 hover:bg-gray-800 hover:text-white transition flex items-center">
                    View More <SlArrowDown className="ml-2 h-3 w-3" />
                  </button>
                  <button onClick={() => handleOpenApply(job)} className="px-5 py-2 bg-black dark:bg-white dark:text-black text-white text-sm rounded-full border border-gray-400 hover:bg-gray-800 hover:text-white transition flex items-center">
                    Apply
                  </button>
                </div>
              </div>
            );
          })}
          {jobs.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No job openings available at the moment.
            </div>
          )}
        </div>
       </div>
      </section>

      {/* What We Value Section */}
      <section className="px-4 md:px-10 py-12 dark:bg-black dark:text-white bg-gray-50">
        <div className=" max-w-7xl mx-auto items-cente flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-2xl font-bold">What We Value</h2>
            <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              <br /><br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <button 
              onClick={() => navigate('/about')}
              className="bg-black dark:bg-white dark:text-black text-white rounded-full py-2 px-4 text-sm w-fit">
              Know More
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:w-1/2">
            {values.map((value, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl shadow-md text-center border dark:border-slate-300 transition ${
                  index === 0 || index === 3 ? 'bg-black text-white' : 'bg-white text-gray-700'
                }`}
              >
                <h3 className="font-semibold mb-2 text-lg">{value.title}</h3>
                <p className="text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Details Modal */}
      {showDetailsModal && selectedJobForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-black dark:text-white rounded-xl max-w-2xl w-full relative">
            <div className="max-h-[85vh] overflow-y-auto p-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-2 right-3 text-xl font-bold text-gray-500 hover:text-black dark:hover:text-white"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">Job Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Title</h3>
                  <p className="text-lg font-medium">{selectedJobForDetails.position}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Experience Required</h3>
                    <p className="text-base">{selectedJobForDetails.experience || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Type</h3>
                    <p className="text-base">{selectedJobForDetails.location || 'Remote'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Job Description</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {selectedJobForDetails.jd}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenApply(selectedJobForDetails);
                  }}
                  className="px-6 py-2 bg-black dark:bg-white dark:text-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-black dark:text-white rounded-xl max-w-2xl w-full relative">
      {/* Scrollable content wrapper */}
      <div className="max-h-[85vh] overflow-y-auto p-6">
        {/* Close Button */}
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-2 right-3 text-xl font-bold dark:bg-black dark:text-white text-gray-500 hover:text-black"
        >
          ×
        </button>

        {/* Heading */}
        <h2 className="text-xl font-semibold mb-6 text-center">Apply Now{selectedJob ? ` — ${selectedJob.position}` : ''}</h2>

        <form className="space-y-4" onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-gray-700  dark:text-white">Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
              required
            />
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700  dark:text-white">Mobile Number</label>
              <input
                type="text"
                name="mobile"
                placeholder="Mobile"
                className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700  dark:text-white">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700  dark:text-white">City</label>
              <input
                type="text"
                name="city"
                placeholder="City"
                className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700  dark:text-white">State</label>
              <input
                type="text"
                name="state"
                placeholder="State"
                className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700  dark:text-white">Total Related Experience</label>
              <input
                type="text"
                name="experience"
                placeholder="e.g. 3 years"
                className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700  dark:text-white">LinkedIn Profile Link</label>
              <input
                type="text"
                name="linkedin"
                placeholder="https://linkedin.com/in/yourname"
                className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
              />
            </div>
          </div>

          {/* Referral Field */}
          <div>
            <label className="text-sm font-medium text-gray-700  dark:text-white">How did you hear about us?</label>
            <input
              type="text"
              name="referral"
              placeholder="e.g. LinkedIn, Friend"
              className="w-full border py-1 px-4 text-sm rounded-xl mt-1"
            />
          </div>

          {/* Upload CV Section */}
          <div>
            <label className="text-sm font-medium text-gray-700  dark:text-white mb-2 block">Upload your CV</label>
            <div className="border-2 border-dashed border-blue-600 rounded-lg p-6 text-center flex flex-col items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 001 1h3M12 12v6m-6 0h12M9 16l3-3 3 3"
                />
              </svg>
              <p className="text-sm text-gray-600  dark:text-white">Drag your file(s) to start uploading</p>
              <span className="text-sm text-gray-500  dark:text-white">OR</span>

              <label className="inline-block">
                <input type="file" name="cv" className="hidden" accept=".pdf,.doc,.docx,.rtf" />
                <span className="cursor-pointer border border-blue-600 text-blue-600 bg-white px-4 py-2 rounded text-sm font-medium">
                  Browse Files
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="bg-black disabled:opacity-60 dark:bg-white dark:text-black text-white px-4 py-2 rounded w-full mt-6"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  </div>
)}

  

      <Footer />
    </div>
  );
};

export default Career;


