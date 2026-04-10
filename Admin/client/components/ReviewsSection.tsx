import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/button';

interface Review {
  id: string;
  name: string;
  date: string;
  rating: number;
  review: string;
  avatar?: string;
}

interface ReviewCategory {
  name: string;
  rating: number;
}

interface ReviewsSectionProps {
  overallRating: number;
  totalReviews: number;
  categories: ReviewCategory[];
  reviews: Review[];
  showAllReviewsHandler?: () => void;
  className?: string;
}

export default function ReviewsSection({
  overallRating,
  totalReviews,
  categories,
  reviews,
  showAllReviewsHandler,
  className = ''
}: ReviewsSectionProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  const handleShowAllReviews = () => {
    if (showAllReviewsHandler) {
      showAllReviewsHandler();
    } else {
      setShowAllReviews(!showAllReviews);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4', 
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`${sizeClasses[size]} ${
              i < Math.floor(rating) 
                ? 'fill-black text-black' 
                : 'text-gray-300'
            }`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overall Rating Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-8">
        <div className="text-center md:text-left">
          <div className="text-4xl font-bold text-black mb-2">{overallRating}</div>
          <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
            {renderStars(overallRating, 'lg')}
          </div>
          <div className="text-sm text-gray-500">{totalReviews} reviews</div>
        </div>
        
        {/* Category Ratings */}
        <div className="flex-1">
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center gap-4">
                <span className="w-32 text-sm text-black font-medium">{category.name}</span>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-black rounded-full transition-all duration-500" 
                      style={{ width: `${(category.rating / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-black w-8 text-right">
                    {category.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayedReviews.map((review) => (
            <div key={review.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                  {review.avatar ? (
                    <img 
                      src={review.avatar} 
                      alt={review.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-medium">
                      {review.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-bold text-black">{review.name}</div>
                    {renderStars(review.rating, 'sm')}
                  </div>
                  <div className="text-sm text-gray-500">{review.date}</div>
                </div>
              </div>
              <p className="text-gray-800 leading-relaxed">{review.review}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Show All Reviews Button */}
      {reviews.length > 4 && (
        <div className="text-center">
          <Button
            variant="outline"
            className="border-black px-8 py-3 rounded-full hover:bg-gray-50"
            onClick={handleShowAllReviews}
          >
            {showAllReviews ? 'Show Less' : `See All ${totalReviews} Reviews`}
          </Button>
        </div>
      )}
    </div>
  );
}

// Predefined review data for different property types
export const campervanReviews: Review[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    date: 'March 2023',
    rating: 5,
    review: 'Amazing camper van experience! The van was spotless, well-equipped, and perfect for our week-long road trip. The kitchen had everything we needed and the bed was surprisingly comfortable. Highly recommend!'
  },
  {
    id: '2', 
    name: 'Mike Chen',
    date: 'February 2023',
    rating: 5,
    review: 'Best rental experience ever! The owner was incredibly helpful with route planning and the van performed flawlessly. The solar setup kept us powered throughout our off-grid adventure in the desert.'
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    date: 'January 2023', 
    rating: 4,
    review: 'Great van for exploring the national parks. Very clean and well-maintained. Only minor issue was the water pump making noise, but it didn\'t affect our trip. Would definitely rent again!'
  },
  {
    id: '4',
    name: 'David Wilson',
    date: 'December 2022',
    rating: 5,
    review: 'Perfect for our family vacation! Kids loved sleeping in the van and the setup made camping so much easier. The outdoor shower was a game changer. Owner provided excellent support throughout.'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    date: 'November 2022',
    rating: 5,
    review: 'Exceeded all expectations! The van was like a luxury hotel on wheels. Every detail was thought out perfectly. The driving experience was smooth and we felt safe the entire trip.'
  },
  {
    id: '6',
    name: 'Alex Park',
    date: 'October 2022',
    rating: 4,
    review: 'Really enjoyed our adventure! The van was well-stocked and the instructions were clear. Great fuel efficiency too. Would love to book this one again for our next trip.'
  }
];

export const uniqueStayReviews: Review[] = [
  {
    id: '1',
    name: 'Margaret Foster',
    date: 'March 2023',
    rating: 5,
    review: 'Absolutely stunning property! The Victorian architecture is breathtaking and every room tells a story. The host was incredibly gracious and knowledgeable about the history. A truly magical experience.'
  },
  {
    id: '2',
    name: 'James Mitchell',
    date: 'February 2023', 
    rating: 5,
    review: 'Perfect for our anniversary getaway! The attention to detail in preserving the historic character while providing modern amenities was impressive. The location couldn\'t be better.'
  },
  {
    id: '3',
    name: 'Catherine Lee',
    date: 'January 2023',
    rating: 5,
    review: 'Felt like stepping back in time! The period furnishings and decor were authentic and beautiful. The gardens are lovely and the neighborhood is perfect for evening strolls.'
  },
  {
    id: '4',
    name: 'Robert Taylor',
    date: 'December 2022',
    rating: 4,
    review: 'Incredible architecture and fantastic location. The rooms are spacious and well-appointed. Only wish we could have stayed longer to fully appreciate all the historical details.'
  },
  {
    id: '5',
    name: 'Sophie Anderson',
    date: 'November 2022',
    rating: 5,
    review: 'A once-in-a-lifetime stay! The mansion is like a private museum with all the comforts of a luxury hotel. Margaret was the perfect host and shared fascinating stories about the property.'
  },
  {
    id: '6',
    name: 'Thomas Brown',
    date: 'October 2022',
    rating: 5,
    review: 'Exceeded every expectation! The preservation of this historic gem is remarkable. Every modern convenience while maintaining the authentic Victorian atmosphere. Truly special.'
  }
];

export const activityReviews: Review[] = [
  {
    id: '1',
    name: 'Jennifer Martinez',
    date: 'March 2023',
    rating: 5,
    review: 'Incredible experience! Marcus was an amazing instructor who made me feel completely safe while pushing me to achieve more than I thought possible. The views from the climbing routes were breathtaking!'
  },
  {
    id: '2',
    name: 'Tom Williams',
    date: 'February 2023',
    rating: 5,
    review: 'Perfect introduction to rock climbing! The instruction was top-notch and the equipment was professional grade. Marcus adapted the difficulty perfectly to our skill level. Can\'t wait to book again!'
  },
  {
    id: '3',
    name: 'Lisa Garcia',
    date: 'February 2023',
    rating: 5,
    review: 'Best adventure activity I\'ve ever done! The combination of expert instruction, safety, and stunning scenery made this unforgettable. Marcus\' passion for climbing is infectious.'
  },
  {
    id: '4',
    name: 'Carlos Rodriguez',
    date: 'January 2023',
    rating: 5,
    review: 'Outstanding experience from start to finish! Professional, safe, and absolutely thrilling. The small group size meant personalized attention and I learned so much in just 3 hours.'
  },
  {
    id: '5',
    name: 'Amanda Johnson',
    date: 'December 2022',
    rating: 4,
    review: 'Great adventure! Marcus was patient and encouraging. The routes were challenging but achievable. Weather was perfect and the photos turned out amazing. Highly recommend!'
  },
  {
    id: '6',
    name: 'Ryan Davis',
    date: 'November 2022',
    rating: 5,
    review: 'Phenomenal experience! As a beginner, I was nervous but Marcus made me feel confident and secure. The progression from easy to challenging routes was perfect. Already planning my next climb!'
  }
];

export const campervanCategories: ReviewCategory[] = [
  { name: 'Cleanliness', rating: 4.9 },
  { name: 'Communication', rating: 4.8 },
  { name: 'Equipment Quality', rating: 4.9 },
  { name: 'Value', rating: 4.7 },
  { name: 'Location', rating: 4.8 }
];

export const uniqueStayCategories: ReviewCategory[] = [
  { name: 'Cleanliness', rating: 4.9 },
  { name: 'Accuracy', rating: 4.8 },
  { name: 'Communication', rating: 4.9 },
  { name: 'Location', rating: 4.9 },
  { name: 'Value', rating: 4.7 }
];

export const activityCategories: ReviewCategory[] = [
  { name: 'Safety', rating: 5.0 },
  { name: 'Instruction Quality', rating: 4.9 },
  { name: 'Equipment', rating: 4.9 },
  { name: 'Location', rating: 4.8 },
  { name: 'Value', rating: 4.8 }
];
