import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/Loader";
import { ChartAreaIcon, HandCoinsIcon, RocketIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function About() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);



  return (
    <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <Header variant="transparent" className="fixed w-full z-50" />

{loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
           Fetching company details...
          </p>
        </div>
      </div>
    )
  }
 <section className="w-full mt-10 relative h-[300px] md:h-[350px] ">
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
      
        </div>
      </section>

      {/* Hero Section */}
      <section className="max-w-7xl  mx-auto md:px-10 py-16 grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Your Home <br /> Away From Home!
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            At Travel Homes, we believe travel is more than just reaching a
            destination—it’s about creating unforgettable experiences, building
            connections, and feeling at home wherever you go.
          </p>
          <div className="flex gap-5 items-center">
            <Link to="/">
            
              <button className="inline-block px-8 my-3 py-4 bg-black text-white dark:bg-white dark:text-black rounded-md shadow-lg hover:scale-105 transition-transform duration-300">
                Book Now
              </button>
            </Link>
            <Button
            onClick={()=>navigate("/")}
              variant="outline"
              className="underline border-transparent font-semibold"
            >
              Explore more
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg shadow-lg animate-slideInRight">
          <img
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80"
            alt="Stay"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl flex justify-between w-full mx-auto px-4 py-8  animate-fadeIn delay-200">
        <p className="italic w-1/2 text-5xl max-md:text-2xl text-start font-bold">
          “Where Unique <br /> Stays Meet <br />
          <span className="text-gray-400">
            Exceptional <br /> Service
          </span>{" "}
          ”
        </p>
        <div className="flex w-1/2 flex-wrap gap-20 mt-8 text-center font-semibold">
          <div>
            <span className="text-3xl md:text-4xl">15k+</span>
            <p className="text-sm text-[#979797]">
              Unique stays in 120+ countries.
            </p>
          </div>
          <div>
            <span className="text-3xl md:text-4xl">80%</span>
            <p className="text-sm text-[#979797]">
              Homes participate eco-friendly
            </p>
          </div>
          <div>
            <span className="text-3xl md:text-4xl">1M+</span>
            <p className="text-sm text-[#979797]">
              Satisfied travelers since 2015.
            </p>
          </div>
          <div>
            <span className="text-3xl md:text-4xl">10k+</span>
            <p className="text-sm text-[#979797]">Trusted hosts worldwide</p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-6 py-12 bg-gray-50 dark:bg-black">
         <div className="max-w-7xl mx-auto items-cente">   
          <h2 className="text-3xl font-bold text-start mb-8 ml-10">Our Values</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <div className="bg-white text-center p-6 rounded-lg shadow w-full md:w-1/3 dark:bg-black border dark:border-slate-100">
            <div className="text-center w-full flex justify-center items-center">
              <RocketIcon />
            </div>
            <h3 className="font-bold mb-2">Readability at Our Core</h3>
            <p className="text-gray-600 dark:text-white">
              We believe in creating welcoming experiences that go beyond
              expectations. Whether it’s through attentive service, a friendly
              smile, or thoughtful details, our commitment to hospitality
              ensures every interaction feels personal, warm, and memorable. We
              treat every individual with respect and care—because at the heart
              of everything we do, people come first.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg text-center shadow w-full md:w-1/3 dark:bg-black border dark:border-slate-100">
            <div className="text-center w-full flex justify-center items-center">
              <ChartAreaIcon />
            </div>
            <h3 className="font-bold mb-2">Hospitality at the Core</h3>
            <p className="text-gray-600 dark:text-white">
              We believe in creating welcoming experiences that go beyond
              expectations. Whether it’s through attentive service, a friendly
              smile, or thoughtful details, our commitment to hospitality
              ensures every interaction feels personal, warm, and memorable. We
              treat every individual with respect and care—because at the heart
              of everything we do, people come first.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg text-center shadow w-full md:w-1/3 dark:bg-black border dark:border-slate-100">
            <div className="text-center w-full flex justify-center items-center">
              <HandCoinsIcon />
            </div>
            <h3 className="font-bold mb-2">Exceptional at Our Core</h3>
            <p className="text-gray-600 dark:text-white">
              We believe in creating welcoming experiences that go beyond
              expectations. Whether it’s through attentive service, a friendly
              smile, or thoughtful details, our commitment to hospitality
              ensures every interaction feels personal, warm, and memorable. We
              treat every individual with respect and care—because at the heart
              of everything we do, people come first.
            </p>
          </div>
        </div>  
          </div>
      </section>

      

      {/* Core Team Section */}
      <section className="py-12 px-10 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto items-cente">
        <h2 className="text-3xl font-bold text-center mb-8">Our Core Team</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          <div className="text-center">
            <img
              src="https://media.istockphoto.com/id/1477871401/photo/portrait-of-happy-young-businesswoman-arms-crossed-with-looking-at-camera-on-white-background.webp?a=1&b=1&s=612x612&w=0&k=20&c=Yv0Xx4Sl54NsId-FNpm8Bd2YlM56gCK3VBmmx-CR_uw="
              alt="Person 1"
              className="w-60 h-60 object-cover rounded-lg mx-auto mb-2"
            />
            <div className="font-semibold">Nashita Chauhan</div>
            <div className="text-gray-500 dark:text-white">CEO</div>
            <div className="flex gap-5 justify-center">
              <FaLinkedin />
              <FaFacebook /> <FaInstagram />
            </div>
          </div>
          <div className="text-center">
            <img
              src="https://media.istockphoto.com/id/2121827514/photo/portrait-of-young-businesswoman-with-curly-hairstyle-wear-trendy-smart-casual-outfit-isolated.webp?a=1&b=1&s=612x612&w=0&k=20&c=R9TOnGlHwC2be_TtbV6WeVf_YPn5dZ24BDVVtRWUrvs="
              alt="Person 2"
              className="w-60 h-60 object-cover rounded-lg mx-auto mb-2"
            />
            <div className="font-semibold">Anisha Singh</div>
            <div className="text-gray-500 dark:text-white">CTO</div>
            <div className="flex gap-5 justify-center">
              <FaLinkedin />
              <FaFacebook /> <FaInstagram />
            </div>
          </div>
          <div className="text-center">
            <img
              src="https://media.istockphoto.com/id/2193065392/photo/young-business-professionals-collaborating-in-a-modern-meeting-room.webp?a=1&b=1&s=612x612&w=0&k=20&c=Y_bBV3QOniNMQ2WGLu0FwymTEqs_4Yiw6v0mWfFPYiY="
              alt="Person 3"
              className="w-60 h-60 object-cover rounded-lg mx-auto mb-2"
            />
            <div className="font-semibold">Kawali Chauha</div>
            <div className="text-gray-500 dark:text-white">COO</div>
            <div className="flex gap-5 justify-center">
              <FaLinkedin />
              <FaFacebook /> <FaInstagram />
            </div>
          </div>
            <div className="text-center">
            <img
              src="https://media.istockphoto.com/id/2193065392/photo/young-business-professionals-collaborating-in-a-modern-meeting-room.webp?a=1&b=1&s=612x612&w=0&k=20&c=Y_bBV3QOniNMQ2WGLu0FwymTEqs_4Yiw6v0mWfFPYiY="
              alt="Person 3"
              className="w-60 h-60 object-cover rounded-lg mx-auto mb-2"
            />
            <div className="font-semibold">Kawali Chauha</div>
            <div className="text-gray-500 dark:text-white">COO</div>
            <div className="flex gap-5 justify-center">
              <FaLinkedin />
              <FaFacebook /> <FaInstagram />
            </div>
          </div>
          
        </div>
        </div>
      </section>

      {/* Vision and Mission */}
      <section className="max-w-7xl mt-20 mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
        <div className="border p-5 rounded-lg shadow-md">
          <h2 className="text-4xl font-bold mb-2">Our Vision</h2>
          <p className="text-gray-600 dark:text-white">
            Viverra ut potenti aliquam feugiat dui imperdiet laoreet tempus sed.
            Elit cursus est lorem in est id nec. Quis diam posuere at nisl eget
            turpis sagittis nunc. Aliquet et ultrices purus, id. Sagittis erat
            nunc in parturient, ut potenti aliquam feugiat dui imperdiet laoreet
            tempus sed. Elit cursus est lorem in est id nec. Quis diam posuere
            at nisl eget turpis.
          </p>
        </div>
        <div className="border overflow-hidden rounded-lg shadow-lg animate-slideInRight">
          <img
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80"
            alt="Stay"
            className="w-full h-full object-cover"
          />
        </div>
      </section>
      <section className="max-w-7xl mt-20 mx-auto px-4 pb-16 grid md:grid-cols-2 gap-8 items-center">
        <div className="border overflow-hidden rounded-lg shadow-lg animate-slideInRight">
          <img
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80"
            alt="Stay"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="border p-5 rounded-lg shadow-md">
          <h2 className="text-4xl font-bold mb-2">Mission</h2>
          <p className="text-gray-600 dark:text-white">
            Viverra ut potenti aliquam feugiat dui imperdiet laoreet tempus sed.
            Elit cursus est lorem in est id nec. Quis diam posuere at nisl eget
            turpis sagittis nunc. Aliquet et ultrices purus, id. Sagittis erat
            nunc in parturient, ut potenti aliquam feugiat dui imperdiet laoreet
            tempus sed. Elit cursus est lorem in est id nec. Quis diam posuere
            at nisl eget turpis.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
