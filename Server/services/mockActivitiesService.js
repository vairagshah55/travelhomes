/**
 * Mock Activities Service - provides sample activity data when MongoDB is not available
 */

const mockActivities = [
  {
    _id: "act1",
    title: "Goa Beach Adventure",
    description: "Enjoy thrilling water sports and beach activities in beautiful Goa",
    images: ["/uploads/activity-photo-1756449590248-8w1i6b.jpg", "/uploads/activity-photo-1756449590269-y1k0kj.jpg"],
    price: 2500,
    personCapacity: 4,
    timeDuration: "4 hours",
    location: { locality: "Calangute", city: "Goa", state: "Goa", pincode: "403516" },
    priceIncludes: ["Equipment", "Guide", "Safety gear", "Refreshments"],
    priceExcludes: ["Transportation", "Personal expenses"],
    expectations: ["Adventure", "Fun", "Safety", "Professional guidance"],
    categories: ["Water Sports", "Adventure"],
    status: "published",
    ratingAverage: 4.5,
    ratingCount: 120,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-02-01")
  },
  {
    _id: "act2", 
    title: "Mountain Trekking Experience",
    description: "Explore scenic mountain trails and enjoy breathtaking views",
    images: ["/uploads/activity-photo-1756449590361-ltjpq2.jpg", "/uploads/activity-photo-1756449590433-i2nigl.jpg"],
    price: 1800,
    personCapacity: 8,
    timeDuration: "6 hours",
    location: { locality: "Manali", city: "Manali", state: "Himachal Pradesh", pincode: "175131" },
    priceIncludes: ["Guide", "Safety equipment", "Lunch", "First aid"],
    priceExcludes: ["Transportation to base", "Personal gear"],
    expectations: ["Physical fitness", "Adventure", "Nature experience"],
    categories: ["Trekking", "Adventure", "Nature"],
    status: "published",
    ratingAverage: 4.7,
    ratingCount: 85,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-05")
  },
  {
    _id: "act3",
    title: "Cultural Heritage Tour", 
    description: "Discover rich cultural heritage and historical landmarks",
    images: ["/uploads/activity-photo-1756449590671-tkhhqw.jpg", "/uploads/activity-photo-1756450121937-rashsk.jpg"],
    price: 1200,
    personCapacity: 15,
    timeDuration: "8 hours",
    location: { locality: "Red Fort Area", city: "Delhi", state: "Delhi", pincode: "110006" },
    priceIncludes: ["Expert guide", "Entry tickets", "Lunch", "Transportation"],
    priceExcludes: ["Personal shopping", "Tips"],
    expectations: ["Cultural learning", "Photography", "Historical insights"],
    categories: ["Cultural", "Heritage", "Educational"],
    status: "published", 
    ratingAverage: 4.3,
    ratingCount: 95,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-02-10")
  },
  {
    _id: "act4",
    title: "Photography Workshop",
    description: "Learn professional photography techniques in scenic locations",
    images: ["/uploads/activity-photo-1756450121966-63fw37.jpg", "/uploads/activity-photo-1756450121976-8d6zfe.jpg"],
    price: 3200,
    personCapacity: 6,
    timeDuration: "Full day",
    location: { locality: "Udaipur City", city: "Udaipur", state: "Rajasthan", pincode: "313001" },
    priceIncludes: ["Professional instructor", "Equipment usage", "Certificate", "Lunch"],
    priceExcludes: ["Personal camera", "Transportation"],
    expectations: ["Basic photography knowledge", "Creativity", "Patience"],
    categories: ["Photography", "Workshop", "Art"],
    status: "published",
    ratingAverage: 4.8,
    ratingCount: 45,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-15")
  },
  {
    _id: "act5",
    title: "Cooking Masterclass",
    description: "Learn to cook authentic local cuisine with expert chefs",
    images: ["/uploads/activity-photo-1756450121983-cnd2h3.jpg", "/uploads/activity-photo-1756450121995-n0fpas.jpg"],
    price: 2800,
    personCapacity: 10,
    timeDuration: "5 hours",
    location: { locality: "Banjara Hills", city: "Hyderabad", state: "Telangana", pincode: "500034" },
    priceIncludes: ["Professional chef", "Ingredients", "Recipe book", "Meal"],
    priceExcludes: ["Takeaway ingredients", "Apron"],
    expectations: ["Interest in cooking", "Participation", "Learning mindset"],
    categories: ["Cooking", "Cultural", "Workshop"],
    status: "published",
    ratingAverage: 4.6,
    ratingCount: 67,
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-20")
  }
];

class MockActivitiesService {
  async findActivities(filter = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    let activities = [...mockActivities];
    
    // Apply filters
    if (filter.status) {
      activities = activities.filter(act => act.status === filter.status);
    }
    
    if (filter.city) {
      activities = activities.filter(act => 
        act.location.city.toLowerCase().includes(filter.city.toLowerCase())
      );
    }
    
    if (filter.state) {
      activities = activities.filter(act => 
        act.location.state.toLowerCase().includes(filter.state.toLowerCase())
      );
    }
    
    if (filter.$or) {
      activities = activities.filter(act => {
        return filter.$or.some(condition => {
          if (condition.title) {
            return act.title.toLowerCase().includes(condition.title.$regex.toLowerCase());
          }
          if (condition.description) {
            return act.description.toLowerCase().includes(condition.description.$regex.toLowerCase());
          }
          return false;
        });
      });
    }
    
    if (filter.price) {
      if (filter.price.$gte) {
        activities = activities.filter(act => act.price >= filter.price.$gte);
      }
      if (filter.price.$lte) {
        activities = activities.filter(act => act.price <= filter.price.$lte);
      }
    }
    
    // Pagination
    const total = activities.length;
    const skip = (page - 1) * limit;
    const paginatedActivities = activities.slice(skip, skip + limit);
    
    return {
      data: paginatedActivities,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    };
  }
  
  async findById(id) {
    return mockActivities.find(act => act._id === id) || null;
  }
  
  async create(data) {
    const newActivity = {
      _id: `act${mockActivities.length + 1}`,
      ...data,
      status: data.status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockActivities.push(newActivity);
    return newActivity;
  }
  
  async updateById(id, data) {
    const index = mockActivities.findIndex(act => act._id === id);
    if (index === -1) return null;
    
    mockActivities[index] = {
      ...mockActivities[index],
      ...data,
      updatedAt: new Date()
    };
    return mockActivities[index];
  }
  
  async deleteById(id) {
    const index = mockActivities.findIndex(act => act._id === id);
    if (index === -1) return null;
    
    const deleted = mockActivities[index];
    mockActivities.splice(index, 1);
    return deleted;
  }
}

module.exports = new MockActivitiesService();