import React, { useEffect, useState } from "react";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { cmsService } from "@/services/cms";
import { StarRating } from "../StarRating";
import type { Testimonial } from "../types";

/**
 * Testimonials admin: list of user-submitted reviews with activate/deactivate
 * and delete actions. Fully self-contained — owns its own state.
 */
export function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = async () => {
    try {
      const list = await cmsService.getTestimonials();
      setTestimonials(list.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3 max-md:flex-wrap">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dashboard-body"
                  size={20}
                />
                <input
                  type="search"
                  placeholder="Search"
                  className="w-full text-sm text-tpl-dark placeholder:text-tpl-dark-5"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 max-md:flex-wrap">
            <div className="flex items-center gap-2">
              <select className="px-4 py-2.5 border border-dashboard-stroke rounded-lg text-sm text-dashboard-body focus:outline-none focus:border-dashboard-primary appearance-none bg-white">
                <option>Sort By</option>
                <option>Rating High to Low</option>
                <option>Rating Low to High</option>
                <option>Date</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 border border-dashboard-stroke rounded-full text-sm text-dashboard-body hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        ></div>

        <div className="border border-dashboard-stroke rounded-xl">
          <div className="px-3 py-3 border-b border-dashboard-stroke">
            <div className="text-dashboard-title font-plus-jakarta text-sm font-bold">
              Testimonial
            </div>
          </div>

          <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
            <div className="bg-gray-50 border-b border-gray-200 flex">
              <div className="w-30 px-4 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">User Name</div>
              <div className="w-32 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">Rating</div>
              <div className="flex-1 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">Review</div>
              <div className="w-24 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">Status</div>
              <div className="w-36 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">Action</div>
            </div>

            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`flex items-start ${index !== testimonials.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="w-30 px-4 py-3.5">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm">
                    {testimonial.userName}
                  </div>
                </div>
                <div className="w-32 px-3 py-3.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-dashboard-heading font-plus-jakarta text-sm font-medium mr-1">
                      {testimonial.rating}
                    </span>
                    <StarRating rating={testimonial.rating} />
                  </div>
                </div>
                <div className="flex-1 px-4 py-3.5">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm leading-6">
                    {testimonial.content}
                  </div>
                </div>
                <div className="w-24 px-3 py-3.5">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      testimonial.isActive !== false
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {testimonial.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="w-36 px-3 py-1.5 flex items-center justify-center relative action-menu-container">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === testimonial.id ? null : testimonial.id)
                    }
                    className="text-dashboard-body hover:text-dashboard-primary transition-colors"
                    aria-label="More actions"
                  >
                    <MoreHorizontal size={22} strokeWidth={2} />
                  </button>
                  {openMenu === testimonial.id && (
                    <div className="absolute right-3 top-9 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-40 py-1">
                      <button
                        onClick={() =>
                          cmsService.toggleTestimonial(testimonial.id).then(() => {
                            setOpenMenu(null);
                            load();
                          })
                        }
                        className="w-full text-left px-4 py-2 text-sm text-dashboard-heading hover:bg-gray-50"
                      >
                        {(testimonial as any).isActive === false ? "Activate" : "Deactivate"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this testimonial?")) {
                            cmsService.deleteTestimonial(testimonial.id).then(() => {
                              setOpenMenu(null);
                              load();
                            });
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestimonialsTab;
