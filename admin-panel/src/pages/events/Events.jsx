import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { useToast } from "../../components/common/ToastContainer";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  Calendar,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Upload,
  Image as ImageIcon,
  X,
  Edit,
  ChevronDown,
  Check,
  FileText,
  User,
  Award,
  DollarSign,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import { format } from "date-fns";

// Indian States and Cities mapping
const stateCityMap = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Bomdila'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Korba', 'Raigarh', 'Jagdalpur'],
  'Delhi': ['New Delhi', 'Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Dharamshala', 'Solan', 'Bilaspur', 'Kullu', 'Manali'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Shimoga'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Kannur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Raipur', 'Ujjain', 'Sagar', 'Dewas'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Kalyan'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Singtam'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad', 'Noida'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur']
}

const Events = () => {
  const { toast } = useToast();
  const [allEvents, setAllEvents] = useState([]); // Store all fetched events
  const [events, setEvents] = useState([]); // Filtered events for display
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming"); // 'upcoming' or 'past'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categories: [],
    sponsors: [],
    organizerId: "",
    duration: "",
    address: {
      fullAddress: "",
      city: "",
      state: "",
      pincode: "",
    },
    slots: [{ date: "", startTime: "", endTime: "" }],
    ticketTypes: [
      { title: "", price: "", totalQuantity: "", availableQuantity: "", description: "" },
    ],
    termsAndConditions: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bannerFiles, setBannerFiles] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);
  const [existingEventImages, setExistingEventImages] = useState([]);
  const [newEventImageFiles, setNewEventImageFiles] = useState([]);
  const [newEventImagePreviews, setNewEventImagePreviews] = useState([]);
  const [existingEventDetailImage, setExistingEventDetailImage] = useState(null);
  const [newEventDetailImageFile, setNewEventDetailImageFile] = useState(null);
  const [newEventDetailImagePreview, setNewEventDetailImagePreview] = useState(null);
  const [sponsorDropdownOpen, setSponsorDropdownOpen] = useState(false);
  const sponsorDropdownRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const eventImageFileInputRef = useRef(null);
  const eventDetailImageFileInputRef = useRef(null);

  useEffect(() => {
    fetchEvents();
    fetchOrganizers();
    fetchCategories();
    fetchSponsors();
  }, [statusFilter, timeFilter]); // Remove page from dependencies, we'll handle pagination after filtering

  // Clear eventDetailImage error when existing image is present in edit mode
  useEffect(() => {
    if (showEditModal && existingEventDetailImage) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.eventDetailImage;
        return newErrors;
      });
    }
  }, [showEditModal, existingEventDetailImage]);

  // Reset page to 1 when filters change (except page itself)
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, organizerFilter, timeFilter]);

  // Filter events based on search, organizer, status, and time filters
  useEffect(() => {
    let filteredEvents = [...allEvents];

    // Filter by time (upcoming/past)
    filteredEvents = filteredEvents.filter((event) => {
      const isUpcoming = isEventUpcoming(event);
      return timeFilter === "upcoming" ? isUpcoming : !isUpcoming;
    });

    // Filter by status
    if (statusFilter !== "all") {
      filteredEvents = filteredEvents.filter(
        (event) => event.status === statusFilter
      );
    }

    // Filter by organizer
    if (organizerFilter !== "all") {
      filteredEvents = filteredEvents.filter((event) => {
        const organizerId =
          event.organizer?.organizerId?._id ||
          event.organizer?.organizerId ||
          "";
        return organizerId === organizerFilter;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.address?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.organizer?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.organizer?.organizerId &&
            typeof event.organizer.organizerId === "object" &&
            event.organizer.organizerId.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Apply pagination after filtering
    const limit = 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    setEvents(paginatedEvents);
    setPagination({
      page,
      limit,
      total: filteredEvents.length,
      pages: Math.ceil(filteredEvents.length / limit),
    });
  }, [allEvents, searchTerm, statusFilter, organizerFilter, timeFilter, page]);

  // Close sponsor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sponsorDropdownRef.current &&
        !sponsorDropdownRef.current.contains(event.target)
      ) {
        setSponsorDropdownOpen(false);
      }
    };

    if (sponsorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sponsorDropdownOpen]);

  const handleSponsorToggle = (sponsorId) => {
    setFormData((prev) => ({
      ...prev,
      sponsors: prev.sponsors.includes(sponsorId)
        ? prev.sponsors.filter((id) => id !== sponsorId)
        : [...prev.sponsors, sponsorId],
    }));
  };

  const fetchOrganizers = async () => {
    try {
      const response = await api.get("/admin/users", {
        params: { role: "organizer", limit: 100 },
      });
      if (response.data.status === 200) {
        setOrganizers(response.data.result.users || []);
      }
    } catch (error) {
      console.error("Error fetching organizers:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/categories");
      if (response.data.status === 200) {
        setCategories(response.data.result.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSponsors = async () => {
    try {
      // Only fetch active sponsors for event form
      const response = await api.get("/admin/sponsors?limit=100");
      if (response.data.status === 200) {
        // Filter to only show active sponsors (backend already filters, but double-check)
        const activeSponsors = (response.data.result.sponsors || []).filter(
          (sponsor) => sponsor.isActive !== false
        );
        setSponsors(activeSponsors);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    }
  };

  const isEventUpcoming = (event) => {
    if (!event.slots || event.slots.length === 0) return false;

    const now = new Date();

    // Get the latest slot date for the event
    const latestSlotDate = event.slots
      .map((slot) => {
        if (typeof slot.date === "string") {
          return new Date(slot.date);
        }
        return slot.date ? new Date(slot.date) : null;
      })
      .filter((date) => date && !isNaN(date.getTime()))
      .sort((a, b) => b - a)[0];

    if (!latestSlotDate) return false;

    // Combine date with end time if available
    const latestSlot = event.slots.find((slot) => {
      const slotDate =
        typeof slot.date === "string"
          ? new Date(slot.date)
          : slot.date
          ? new Date(slot.date)
          : null;
      return slotDate && slotDate.getTime() === latestSlotDate.getTime();
    });

    let eventEndDateTime = new Date(latestSlotDate);
    if (latestSlot?.endTime) {
      const [hours, minutes] = latestSlot.endTime.split(":");
      eventEndDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    return eventEndDateTime >= now;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1, // Always fetch all events for client-side filtering
        limit: 1000, // Large limit to get all events
      };

      const response = await api.get("/admin/events", { params });
      if (response.data.status === 200) {
        // Store all events, filtering will be done in useEffect
        setAllEvents(response.data.result.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error(error.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (event) => {
    try {
      const response = await api.put(`/admin/events/${event._id}/feature`, {
        isFeatured: !event.isFeatured,
      });

      if (response.data.status === 200) {
        toast.success(
          `Event ${!event.isFeatured ? "featured" : "unfeatured"} successfully`
        );
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update event");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const handleCreateEvent = () => {
    setFormData({
      title: "",
      description: "",
      categories: [],
      sponsors: [],
      organizerId: "",
      duration: "",
      address: {
        fullAddress: "",
        city: "",
        state: "",
        pincode: "",
      },
      slots: [{ date: "", startTime: "", endTime: "" }],
      ticketTypes: [
        { title: "", price: "", totalQuantity: "", availableQuantity: "", description: "" },
      ],
      termsAndConditions: "",
      notes: "",
    });
    setFormErrors({});
    setBannerFiles([]);
    setBannerPreviews([]);
    setExistingEventImages([]);
    setNewEventImageFiles([]);
    setNewEventImagePreviews([]);
    setExistingEventDetailImage(null);
    setNewEventDetailImageFile(null);
    setNewEventDetailImagePreview(null);
    setSelectedEventForEdit(null);
    setShowCreateModal(true);
    setShowEditModal(false);
  };

  const handleEditEvent = (event) => {
    // Check if event is past and prevent editing
    if (!isEventUpcoming(event)) {
      toast.error('Cannot edit past events');
      return;
    }
    
    setSelectedEventForEdit(event);
    // Find organizer ID
    const organizerId =
      event.organizer?.organizerId?._id || event.organizer?.organizerId || "";

    setFormData({
      title: event.title || "",
      description: event.description || "",
      categories: event.categories?.map((cat) => cat._id || cat) || [],
      sponsors: event.sponsors?.map((sp) => sp._id || sp) || [],
      organizerId: organizerId,
      duration: event.duration?.toString() || "",
      address: event.address || {
        fullAddress: "",
        city: "",
        state: "",
        pincode: "",
      },
      slots:
        event.slots?.length > 0
          ? event.slots.map((slot) => ({
              date: slot.date
                ? typeof slot.date === "string"
                  ? slot.date.split("T")[0]
                  : new Date(slot.date).toISOString().split("T")[0]
                : "",
              startTime: slot.startTime || "",
              endTime: slot.endTime || "",
            }))
          : [{ date: "", startTime: "", endTime: "" }],
      ticketTypes:
        event.ticketTypes?.length > 0
          ? event.ticketTypes.map((tt) => ({
              title: tt.title || "",
              price: tt.price?.toString() || "",
              totalQuantity: tt.totalQuantity?.toString() || "",
              availableQuantity:
                tt.availableQuantity?.toString() ||
                tt.totalQuantity?.toString() ||
                "",
              description: tt.description || "",
            }))
          : [
              {
                title: "",
                price: "",
                totalQuantity: "",
                availableQuantity: "",
                description: "",
              },
            ],
      termsAndConditions: event.termsAndConditions || "",
      notes: event.notes || "",
    });
    setFormErrors({});
    setBannerFiles([]);
    setBannerPreviews([]);
    // Set existing banner previews
    if (event.banners && event.banners.length > 0) {
      const baseURL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const apiBase = baseURL.replace("/api", "");
      setBannerPreviews(event.banners.map((banner) => `${apiBase}${banner}`));
    }
    // Set existing event images
    if (event.eventImages && event.eventImages.length > 0) {
      setExistingEventImages(event.eventImages);
    } else {
      setExistingEventImages([]);
    }
    setNewEventImageFiles([]);
    setNewEventImagePreviews([]);
    
    // Set existing event detail image
    if (event.eventDetailImage) {
      const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const apiBase = baseURL.replace("/api", "");
      setExistingEventDetailImage(`${apiBase}${event.eventDetailImage}`);
      // Clear error if existing image is present
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.eventDetailImage;
        return newErrors;
      });
    } else {
      setExistingEventDetailImage(null);
    }
    setNewEventDetailImageFile(null);
    setNewEventDetailImagePreview(null);
    
    setShowEditModal(true);
    setShowCreateModal(false);
    setActionMenu(null);
  };

  const handleBannerChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate each banner image dimension
    const validFiles = [];
    const invalidFiles = [];
    
    for (const file of files) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        invalidFiles.push({ file, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
        continue;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push({ file, error: 'File size must be less than 10MB' });
        continue;
      }

      // Check total number of files (max 10)
      if (bannerFiles.length + validFiles.length >= 10) {
        invalidFiles.push({ file, error: 'Maximum 10 banner images allowed' });
        continue;
      }

      // Validate image dimensions
      try {
        await validateImageDimensions(file, 1600, 900);
        validFiles.push(file);
      } catch (error) {
        invalidFiles.push({ file, error: error.message });
      }
    }
    
    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, error }) => {
        toast.error(`${file.name}: ${error}`);
      });
    }
    
    // Only add valid files
    if (validFiles.length > 0) {
      const previewPromises = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ file, preview: reader.result });
          };
          reader.readAsDataURL(file);
        });
      });

      // Update files immediately
      const newFiles = [...bannerFiles, ...validFiles];
      setBannerFiles(newFiles);

      // Update previews when all are loaded
      Promise.all(previewPromises).then((previews) => {
        setBannerPreviews([...bannerPreviews, ...previews]);
        // Clear banner error when files are added
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.banners;
          return newErrors;
        });
      });
    }

    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const removeBanner = (index) => {
    const newBannerFiles = bannerFiles.filter((_, i) => i !== index);
    const newBannerPreviews = bannerPreviews.filter((_, i) => i !== index);
    setBannerFiles(newBannerFiles);
    setBannerPreviews(newBannerPreviews);
    // Clear banner error if there are still banners remaining
    if (newBannerPreviews.length > 0) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.banners;
        return newErrors;
      });
    }
  };

  const handleEventImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const previewPromises = [];

    files.forEach((file) => {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(
          `${file.name}: Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.`
        );
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 10MB`);
        return;
      }

      validFiles.push(file);

      // Create preview promise
      const previewPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ file, preview: reader.result });
        };
        reader.readAsDataURL(file);
      });
      previewPromises.push(previewPromise);
    });

    // Update files immediately
    const newFiles = [...newEventImageFiles, ...validFiles];
    setNewEventImageFiles(newFiles);

    // Update previews when all are loaded
    Promise.all(previewPromises).then((previews) => {
      setNewEventImagePreviews([...newEventImagePreviews, ...previews]);
    });

    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const removeExistingEventImage = (index) => {
    setExistingEventImages(existingEventImages.filter((_, i) => i !== index));
  };

  const removeNewEventImage = (index) => {
    // Revoke the object URL to free memory
    if (newEventImagePreviews[index]?.preview) {
      URL.revokeObjectURL(newEventImagePreviews[index].preview);
    }
    setNewEventImageFiles(newEventImageFiles.filter((_, i) => i !== index));
    setNewEventImagePreviews(newEventImagePreviews.filter((_, i) => i !== index));
  };

  const handleEventDetailImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    // Validate image dimensions (portrait orientation)
    try {
      await validateEventDetailImageDimensions(file);
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setNewEventDetailImageFile(file);
      setNewEventDetailImagePreview(preview);
      
      // Clear error when file is added
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.eventDetailImage;
        return newErrors;
      });
    } catch (error) {
      toast.error(error.message);
      // Reset input to allow selecting the same file again
      e.target.value = "";
    }
  };

  const removeExistingEventDetailImage = () => {
    setExistingEventDetailImage(null);
  };

  const removeNewEventDetailImage = () => {
    if (newEventDetailImagePreview) {
      URL.revokeObjectURL(newEventDetailImagePreview);
    }
    setNewEventDetailImageFile(null);
    setNewEventDetailImagePreview(null);
  };

  // Validation functions
  const validateDuration = (value) => {
    const num = parseFloat(value);
    if (!value) return 'Duration is required';
    if (isNaN(num) || num < 1 || num > 24) return 'Duration must be between 1 and 24 hours';
    return '';
  };

  const validateDate = (dateString) => {
    if (!dateString) return 'Date is required';
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return 'Date cannot be in the past';
    return '';
  };

  const validatePincode = (value) => {
    if (!value) return 'Pincode is required';
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length !== 6) return 'Pincode must be exactly 6 digits';
    return '';
  };

  // Validate image dimensions (minimum 1600x900 for banners)
  const validateImageDimensions = (file, minWidth = 1600, minHeight = 900) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width >= minWidth && img.height >= minHeight) {
          resolve(true);
        } else {
          reject(new Error(`Image dimensions must be at least ${minWidth}x${minHeight}px. Current dimensions: ${img.width}x${img.height}px`));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  };

  // Validate event detail image dimensions (portrait orientation - height > width)
  const validateEventDetailImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        // Check if image is portrait (height > width)
        if (img.height > img.width) {
          resolve(true);
        } else {
          reject(new Error(`Event detail image must be in portrait orientation (height > width). Current dimensions: ${img.width}x${img.height}px`));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  };

  const validateForm = () => {
    const errors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }
    
    // Organizer validation
    if (!formData.organizerId) {
      errors.organizerId = "Organizer is required";
    }
    
    // Categories validation
    if (formData.categories.length === 0) {
      errors.categories = "At least one category is required";
    }
    
    // Duration validation
    const durationError = validateDuration(formData.duration);
    if (durationError) {
      errors.duration = durationError;
    }
    
    // Address validation
    if (!formData.address.fullAddress.trim()) {
      errors.fullAddress = "Full address is required";
    }
    if (!formData.address.city.trim()) {
      errors.city = "City is required";
    }
    if (!formData.address.state.trim()) {
      errors.state = "State is required";
    }
    const pincodeError = validatePincode(formData.address.pincode);
    if (pincodeError) {
      errors.pincode = pincodeError;
    }
    
    // Slots validation
    formData.slots.forEach((slot, index) => {
      const dateError = validateDate(slot.date);
      if (dateError) {
        errors[`slot_${index}_date`] = dateError;
      }
      if (!slot.startTime) {
        errors[`slot_${index}_startTime`] = "Start time is required";
      }
      if (!slot.endTime) {
        errors[`slot_${index}_endTime`] = "End time is required";
      }
    });
    
    // Ticket types validation
    formData.ticketTypes.forEach((ticket, index) => {
      if (!ticket.title.trim()) {
        errors[`ticket_${index}_title`] = "Ticket title is required";
      }
      if (!ticket.price || parseFloat(ticket.price) <= 0) {
        errors[`ticket_${index}_price`] = "Valid price is required";
      }
      if (!ticket.totalQuantity || parseInt(ticket.totalQuantity) <= 0) {
        errors[`ticket_${index}_totalQuantity`] = "Valid total quantity is required";
      }
      const totalQty = parseInt(ticket.totalQuantity) || 0;
      const availableQty = parseInt(ticket.availableQuantity) || 0;
      if (totalQty > 0 && availableQty > totalQty) {
        errors[`ticket_${index}_availableQuantity`] = `Available quantity cannot exceed total quantity (${totalQty})`;
      }
      if (!ticket.availableQuantity && totalQty > 0) {
        errors[`ticket_${index}_availableQuantity`] = 'Available quantity is required';
      }
    });
    
    // Terms and conditions validation
    if (!formData.termsAndConditions.trim()) {
      errors.termsAndConditions = "Terms and conditions are required";
    }
    
    // Notes validation
    if (!formData.notes || !formData.notes.trim()) {
      errors.notes = "Notes are required";
    }
    
    // Banner images and event images are now optional - no validation needed
    
    // Validate event detail image is required
    // Check if there's an existing image (not removed) or a new image
    const hasExistingImage = showEditModal && selectedEventForEdit && existingEventDetailImage && existingEventDetailImage !== null && existingEventDetailImage !== ''
    const hasNewImage = newEventDetailImageFile !== null && newEventDetailImageFile !== undefined
    if (!hasExistingImage && !hasNewImage) {
      errors.eventDetailImage = "Event detail image is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form and get errors
    const isValid = validateForm();
    
    if (!isValid) {
      // Wait for React to update DOM with error classes
      setTimeout(() => {
        // Scroll to first error field
        const firstErrorField = document.querySelector('.border-red-500');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorField.focus();
        } else {
          // If no field with error class, scroll to first error message
          const firstErrorMsg = document.querySelector('.text-red-500.text-xs');
          if (firstErrorMsg) {
            firstErrorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("organizerId", formData.organizerId);
      formDataToSend.append("duration", parseFloat(formData.duration));
      formDataToSend.append("termsAndConditions", formData.termsAndConditions);
      formDataToSend.append("notes", formData.notes);

      // Add JSON fields as strings
      formDataToSend.append("categories", JSON.stringify(formData.categories));
      formDataToSend.append("sponsors", JSON.stringify(formData.sponsors));
      formDataToSend.append("address", JSON.stringify(formData.address));
      formDataToSend.append(
        "slots",
        JSON.stringify(
          formData.slots.filter(
            (slot) => slot.date && slot.startTime && slot.endTime
          )
        )
      );
      formDataToSend.append(
        "ticketTypes",
        JSON.stringify(
          formData.ticketTypes
            .filter((tt) => tt.title && tt.price && tt.totalQuantity)
            .map((tt) => ({
              ...tt,
              price: parseFloat(tt.price),
              totalQuantity: parseInt(tt.totalQuantity),
              availableQuantity: parseInt(
                tt.availableQuantity || tt.totalQuantity
              ),
              description: tt.description || "",
            }))
        )
      );

      // Add banner files
      bannerFiles.forEach((file) => {
        formDataToSend.append("banners", file);
      });

      // Add event image files
      newEventImageFiles.forEach((file) => {
        formDataToSend.append("eventImages", file);
      });

      // Add existing event images as JSON string (if any, for edit mode)
      if (showEditModal && selectedEventForEdit && existingEventImages.length > 0) {
        formDataToSend.append("existingEventImages", JSON.stringify(existingEventImages));
      }

      // Add event detail image file (single file)
      if (newEventDetailImageFile) {
        formDataToSend.append("eventDetailImage", newEventDetailImageFile);
      }
      
      // Add existing event detail image as string (if any, for edit mode)
      if (showEditModal && selectedEventForEdit && existingEventDetailImage && !newEventDetailImageFile) {
        // Extract the path from the full URL
        const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        const apiBase = baseURL.replace("/api", "");
        const imagePath = existingEventDetailImage.replace(apiBase, "");
        formDataToSend.append("existingEventDetailImage", imagePath);
      }

      let response;
      if (showEditModal && selectedEventForEdit) {
        response = await api.put(
          `/admin/events/${selectedEventForEdit._id}`,
          formDataToSend
        );
      } else {
        response = await api.post("/admin/events", formDataToSend);
      }

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(
          `Event ${showEditModal ? "updated" : "created"} successfully`
        );
        setShowCreateModal(false);
        setShowEditModal(false);
        setFormData({
          title: "",
          description: "",
          categories: [],
          sponsors: [],
          organizerId: "",
          duration: "",
          address: {
            fullAddress: "",
            city: "",
            state: "",
            pincode: "",
          },
                      slots: [{ date: "", startTime: "", endTime: "" }],
                      ticketTypes: [
                        { title: "", price: "", totalQuantity: "", availableQuantity: "", description: "" },
                      ],
          termsAndConditions: "",
          notes: "",
        });
        setBannerFiles([]);
        setBannerPreviews([]);
        setExistingEventImages([]);
        setNewEventImageFiles([]);
        setNewEventImagePreviews([]);
        setExistingEventDetailImage(null);
        setNewEventDetailImageFile(null);
        setNewEventDetailImagePreview(null);
        setSelectedEventForEdit(null);
        fetchEvents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const addSlot = () => {
    setFormData({
      ...formData,
      slots: [...formData.slots, { date: "", startTime: "", endTime: "" }],
    });
  };

  const removeSlot = (index) => {
    setFormData({
      ...formData,
      slots: formData.slots.filter((_, i) => i !== index),
    });
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...formData.slots];
    newSlots[index][field] = value;
    setFormData({ ...formData, slots: newSlots });
    
    // Validate date
    if (field === 'date') {
      const error = validateDate(value);
      setFormErrors(prev => ({
        ...prev,
        [`slot_${index}_date`]: error || undefined
      }));
    }
  };

  const addTicketType = () => {
    setFormData({
      ...formData,
      ticketTypes: [
        ...formData.ticketTypes,
        { title: "", price: "", totalQuantity: "", availableQuantity: "", description: "" },
      ],
    });
  };

  const removeTicketType = (index) => {
    setFormData({
      ...formData,
      ticketTypes: formData.ticketTypes.filter((_, i) => i !== index),
    });
  };

  const updateTicketType = (index, field, value) => {
    const newTicketTypes = [...formData.ticketTypes];
    
    // Handle numeric fields
    if (field === 'price' || field === 'totalQuantity' || field === 'availableQuantity') {
      const numericValue = value.replace(/[^\d.]/g, '');
      newTicketTypes[index][field] = numericValue;
    } else {
      newTicketTypes[index][field] = value;
    }
    
    // Validate availableQuantity against totalQuantity
    if (field === 'availableQuantity') {
      const totalQty = parseInt(newTicketTypes[index].totalQuantity) || 0;
      const availableQty = parseInt(newTicketTypes[index][field]) || 0;
      if (totalQty > 0 && availableQty > totalQty) {
        setFormErrors(prev => ({
          ...prev,
          [`ticket_${index}_availableQuantity`]: `Available quantity cannot exceed total quantity (${totalQty})`
        }));
      } else {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`ticket_${index}_availableQuantity`];
          return newErrors;
        });
      }
    }
    
    // If totalQuantity changes, update availableQuantity if it exceeds
    if (field === 'totalQuantity') {
      const totalQty = parseInt(newTicketTypes[index][field]) || 0;
      const currentAvailable = parseInt(newTicketTypes[index].availableQuantity) || 0;
      if (currentAvailable > totalQty) {
        newTicketTypes[index].availableQuantity = totalQty > 0 ? totalQty.toString() : '';
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`ticket_${index}_availableQuantity`];
          return newErrors;
        });
      }
    }
    
    setFormData({ ...formData, ticketTypes: newTicketTypes });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Events
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">
            Manage all platform events
          </p>
        </div>
        <button
          onClick={handleCreateEvent}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setTimeFilter("upcoming");
            setPage(1);
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
            timeFilter === "upcoming"
              ? "border-primary-600 text-primary-600 bg-primary-50/50"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => {
            setTimeFilter("past");
            setPage(1);
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
            timeFilter === "past"
              ? "border-primary-600 text-primary-600 bg-primary-50/50"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
          }`}
        >
          Past Events
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={organizerFilter}
            onChange={(e) => {
              setOrganizerFilter(e.target.value);
              setPage(1);
            }}
            className="input-field sm:w-48"
          >
            <option value="all">All Organizers</option>
            {organizers
              .filter((o) => o.isActive)
              .map((organizer) => (
                <option key={organizer._id} value={organizer._id}>
                  {organizer.name}
                </option>
              ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-field sm:w-48"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No ${
            timeFilter === "upcoming" ? "upcoming" : "past"
          } events found`}
          message={
            searchTerm || statusFilter !== "all"
              ? "No events match your search or filter criteria."
              : timeFilter === "upcoming"
              ? "There are no upcoming events at the moment."
              : "There are no past events."
          }
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => {
                    // Get earliest slot date
                    const earliestSlot =
                      event.slots && event.slots.length > 0
                        ? event.slots
                            .map((slot) => {
                              const slotDate =
                                typeof slot.date === "string"
                                  ? new Date(slot.date)
                                  : slot.date
                                  ? new Date(slot.date)
                                  : null;
                              return slotDate && !isNaN(slotDate.getTime())
                                ? { date: slotDate, slot }
                                : null;
                            })
                            .filter(Boolean)
                            .sort((a, b) => a.date - b.date)[0]
                        : null;

                    const organizerName =
                      event.organizer?.name ||
                      (event.organizer?.organizerId &&
                      typeof event.organizer.organizerId === "object"
                        ? event.organizer.organizerId.name
                        : "") ||
                      "N/A";
                    const location = event.address
                      ? `${event.address.city}, ${event.address.state}`
                      : "N/A";

                    return (
                      <tr
                        key={event._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            {event.eventDetailImage ? (
                              <img
                                src={`${(
                                  import.meta.env.VITE_API_BASE_URL ||
                                  "http://localhost:5000/api"
                                ).replace("/api", "")}${event.eventDetailImage}`}
                                alt={event.title}
                                className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : event.banners && event.banners.length > 0 ? (
                              <img
                                src={`${(
                                  import.meta.env.VITE_API_BASE_URL ||
                                  "http://localhost:5000/api"
                                ).replace("/api", "")}${event.banners[0]}`}
                                alt={event.title}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-6 h-6 text-primary-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="relative group">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {event.title.length > 30
                                    ? `${event.title.substring(0, 30)}...`
                                    : event.title}
                                </h3>
                                {event.title.length > 30 && (
                                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-[10000] pointer-events-none">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap pointer-events-auto">
                                      Full Title: {event.title}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {earliestSlot && (
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(earliestSlot.date, "MMM dd, yyyy")}
                                  </div>
                                  {earliestSlot.slot.startTime &&
                                    earliestSlot.slot.endTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {earliestSlot.slot.startTime} - {earliestSlot.slot.endTime}
                                      </div>
                                    )}
                                </div>
                              )}
                              {event.address && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {location}
                                </div>
                              )}
                              {event.isFeatured && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div className="relative group">
                              <span className="text-sm text-gray-900">
                                {organizerName.length > 20
                                  ? `${organizerName.substring(0, 20)}...`
                                  : organizerName}
                              </span>
                              {organizerName.length > 20 && (
                                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-[10000] pointer-events-none">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap pointer-events-auto">
                                    Full Name: {organizerName}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              event.status
                            )}`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditEvent(event)}
                              disabled={!isEventUpcoming(event)}
                              className={`p-2 rounded-lg transition-colors ${
                                isEventUpcoming(event)
                                  ? "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                  : "text-gray-300 cursor-not-allowed opacity-50"
                              }`}
                              title={isEventUpcoming(event) ? "Edit Event" : "Cannot edit past events"}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleFeatureToggle(event)}
                              className={`p-2 rounded-lg transition-colors ${
                                event.isFeatured
                                  ? "text-yellow-600 hover:bg-yellow-50"
                                  : "text-gray-600 hover:text-yellow-600 hover:bg-yellow-50"
                              }`}
                              title={event.isFeatured ? "Unfeature" : "Feature"}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  event.isFeatured ? "fill-current" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, pagination.total)} of {pagination.total}{" "}
                events
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {(() => {
                  const pages = []
                  const totalPages = pagination.pages
                  const currentPage = page
                  
                  // Show first page
                  if (totalPages > 0) {
                    pages.push(1)
                  }
                  
                  // Calculate range around current page
                  let startPage = Math.max(2, currentPage - 1)
                  let endPage = Math.min(totalPages - 1, currentPage + 1)
                  
                  // Adjust if near start or end
                  if (currentPage <= 3) {
                    endPage = Math.min(5, totalPages - 1)
                  }
                  if (currentPage >= totalPages - 2) {
                    startPage = Math.max(2, totalPages - 4)
                  }
                  
                  // Add ellipsis after first page if needed
                  if (startPage > 2) {
                    pages.push('...')
                  }
                  
                  // Add pages in range
                  for (let i = startPage; i <= endPage; i++) {
                    if (i > 1 && i < totalPages) {
                      pages.push(i)
                    }
                  }
                  
                  // Add ellipsis before last page if needed
                  if (endPage < totalPages - 1) {
                    pages.push('...')
                  }
                  
                  // Show last page if more than 1 page
                  if (totalPages > 1) {
                    pages.push(totalPages)
                  }
                  
                  return pages.map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-primary-600 text-white border border-primary-600'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })
                })()}
                
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

     {/* Event Details Modal - Complete Version */}
{showDetailsModal && selectedEvent && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in border border-gray-200/60">
      {/* Sticky Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200/80 bg-white rounded-t-2xl">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate pr-4">
              {selectedEvent.title}
            </h2>
            {selectedEvent.address && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {selectedEvent.address.city}, {selectedEvent.address.state}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200 ml-2"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(selectedEvent.status)}`}>
                {selectedEvent.status}
              </span>
            </div>
            {selectedEvent.isFeatured && (
              <span className="px-3 py-1.5 bg-primary-100 text-primary-800 border border-primary-200 rounded-lg text-sm font-semibold">
                Featured
              </span>
            )}
          </div>

          {/* Description */}
          <div className="pb-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{selectedEvent.description || 'No description provided'}</p>
          </div>

          {/* Event Detail Image */}
          {selectedEvent.eventDetailImage && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" />
                Event Detail Image
              </h4>
              <div>
                <img
                  src={selectedEvent.eventDetailImage.startsWith('http') 
                    ? selectedEvent.eventDetailImage 
                    : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "")}${selectedEvent.eventDetailImage}`}
                  alt="Event Detail"
                  className="w-48 h-96 object-contain rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Banner Images */}
          {selectedEvent.banners && selectedEvent.banners.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" />
                Banner Images
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedEvent.banners.map((banner, index) => {
                  const imageUrl = banner.startsWith('http') 
                    ? banner 
                    : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "")}${banner}`;
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Banner ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Event Images */}
          {selectedEvent.eventImages && selectedEvent.eventImages.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" />
                Event Images
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedEvent.eventImages.map((image, index) => {
                  const imageUrl = image.startsWith('http') 
                    ? image 
                    : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "")}${image}`;
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Event Image ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Event Details Grid */}
          {(selectedEvent.address || selectedEvent.duration) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
              {/* Location */}
              {selectedEvent.address && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Location</h4>
                    <p className="text-sm text-gray-600 mb-1">{selectedEvent.address.fullAddress}</p>
                    <p className="text-sm text-gray-500">
                      {selectedEvent.address.city}, {selectedEvent.address.state} - {selectedEvent.address.pincode}
                    </p>
                  </div>
                </div>
              )}

              {/* Duration */}
              {selectedEvent.duration && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Duration</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.duration} hours</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Slots */}
          {selectedEvent.slots && selectedEvent.slots.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                Event Slots
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedEvent.slots.map((slot, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">
                        {format(new Date(slot.date), 'MMM d, yyyy')}
                      </p>
                      {slot.isActive !== undefined && (
                        slot.isActive ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-lg text-xs font-semibold">
                            Inactive
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Types */}
          {selectedEvent.ticketTypes && selectedEvent.ticketTypes.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary-600" />
                Ticket Types
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedEvent.ticketTypes.map((ticket, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{ticket.title}</p>
                      <p className="font-bold text-primary-600 text-lg">₹{ticket.price}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="text-gray-600">
                        Available: <span className="font-medium text-gray-900">{ticket.availableQuantity}</span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        Total: <span className="font-medium text-gray-900">{ticket.totalQuantity}</span>
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>
                    )}
                  </div>
                ))} 
              </div>
            </div>
          )}

          {/* Date Information (Legacy fields for backward compatibility) */}
          {(selectedEvent.startDate || selectedEvent.endDate) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
                Legacy Event Schedule
              </h3>
              <div className="space-y-3">
                {selectedEvent.startDate && (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-blue-700 min-w-0 w-16">Start:</span>
                    <span className="text-blue-900 ml-2">{format(new Date(selectedEvent.startDate), 'PPpp')}</span>
                  </div>
                )}
                {selectedEvent.endDate && (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-blue-700 min-w-0 w-16">End:</span>
                    <span className="text-blue-900 ml-2">{format(new Date(selectedEvent.endDate), 'PPpp')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organizer Information */}
          {selectedEvent.organizer && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600" />
                Organizer Information
              </h4>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Name</span>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedEvent.organizer.name || (selectedEvent.organizer.organizerId && typeof selectedEvent.organizer.organizerId === 'object' ? selectedEvent.organizer.organizerId.name : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Contact</span>
                    <p className="text-sm text-gray-900">
                      {selectedEvent.organizer.contactInfo || (selectedEvent.organizer.organizerId && typeof selectedEvent.organizer.organizerId === 'object' ? selectedEvent.organizer.organizerId.email : 'N/A')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sponsors */}
          {selectedEvent.sponsors && selectedEvent.sponsors.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-600" />
                Sponsors
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEvent.sponsors.map((sponsor) => {
                  const sponsorData = sponsor._id ? sponsor : selectedEvent.sponsors.find(s => s._id === sponsor)
                  if (!sponsorData) return null
                  
                  const getTypeLabel = (type) => {
                    const labels = {
                      'sponsor': 'Sponsor',
                      'co-sponsor': 'Co-Sponsor',
                      'community partner': 'Community Partner',
                      'technology partner': 'Technology Partner',
                      'social media partner': 'Social Media Partner',
                    }
                    return labels[type] || type
                  }

                  const getTypeColor = (type) => {
                    const colors = {
                      'sponsor': 'bg-blue-100 text-blue-800 border-blue-200',
                      'co-sponsor': 'bg-purple-100 text-purple-800 border-purple-200',
                      'community partner': 'bg-green-100 text-green-800 border-green-200',
                      'technology partner': 'bg-orange-100 text-orange-800 border-orange-200',
                      'social media partner': 'bg-pink-100 text-pink-800 border-pink-200',
                    }
                    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
                  }

                  return (
                    <div
                      key={sponsorData._id || sponsor}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {sponsorData.logo && (
                          <img
                            src={sponsorData.logo.startsWith('http') 
                              ? sponsorData.logo 
                              : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "")}${sponsorData.logo}`}
                            alt={sponsorData.name}
                            className="w-16 h-16 object-contain rounded-lg border border-gray-200 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-gray-900 text-sm">{sponsorData.name}</h5>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(sponsorData.type)}`}>
                              {getTypeLabel(sponsorData.type)}
                            </span>
                          </div>
                          
                          {/* Social Media Links */}
                          {(sponsorData.website || sponsorData.socialMedia) && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {sponsorData.website && (
                                <a
                                  href={sponsorData.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Website"
                                >
                                  <Globe className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.facebook && (
                                <a
                                  href={sponsorData.socialMedia.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Facebook"
                                >
                                  <Facebook className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.twitter && (
                                <a
                                  href={sponsorData.socialMedia.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Twitter"
                                >
                                  <Twitter className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.instagram && (
                                <a
                                  href={sponsorData.socialMedia.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                                  title="Instagram"
                                >
                                  <Instagram className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.linkedin && (
                                <a
                                  href={sponsorData.socialMedia.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="LinkedIn"
                                >
                                  <Linkedin className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.youtube && (
                                <a
                                  href={sponsorData.socialMedia.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="YouTube"
                                >
                                  <Youtube className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          {selectedEvent.categories && selectedEvent.categories.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.categories.map((cat) => (
                  <span
                    key={cat._id || cat}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium"
                  >
                    {cat.name || cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {selectedEvent.termsAndConditions && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                Terms & Conditions
              </h4>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedEvent.termsAndConditions}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedEvent.notes && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                Notes
              </h4>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedEvent.notes}</p>
              </div>
            </div>
          )}

          {/* Venue (Legacy field) */}
          {selectedEvent.venue && !selectedEvent.address && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Venue
              </h3>
              <p className="text-gray-900">
                {typeof selectedEvent.venue === 'string' ? selectedEvent.venue : selectedEvent.venue.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200/80 bg-gray-50/80 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Event Details • Last updated: {new Date().toLocaleDateString()}
          </div>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Create/Edit Event Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200/60 animate-scale-in">
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">
                {showEditModal ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedEventForEdit(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form
                id="event-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        // Clear error when user starts typing
                        if (formErrors.title && e.target.value.trim()) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.title;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (!formData.title.trim()) {
                          setFormErrors(prev => ({
                            ...prev,
                            title: "Title is required"
                          }));
                        }
                      }}
                      className={`input-field ${
                        formErrors.title ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.title}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        });
                        // Clear error when user starts typing
                        if (formErrors.description && e.target.value.trim()) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.description;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (!formData.description.trim()) {
                          setFormErrors(prev => ({
                            ...prev,
                            description: "Description is required"
                          }));
                        }
                      }}
                      className={`input-field min-h-[100px] ${
                        formErrors.description ? "border-red-500" : ""
                      }`}
                      rows={4}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.description}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organizer *
                      </label>
                      <select
                        value={formData.organizerId}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            organizerId: e.target.value,
                          });
                          // Clear error when user selects an organizer
                          if (formErrors.organizerId && e.target.value) {
                            setFormErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.organizerId;
                              return newErrors;
                            });
                          }
                        }}
                        className={`input-field ${
                          formErrors.organizerId ? "border-red-500" : ""
                        }`}
                      >
                        <option value="">Select Organizer</option>
                        {organizers
                          .filter((o) => o.isActive)
                          .map((organizer) => (
                            <option key={organizer._id} value={organizer._id}>
                              {organizer.name} ({organizer.email})
                            </option>
                          ))}
                      </select>
                      {formErrors.organizerId && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.organizerId}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (hours) *
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, "");
                          setFormData({ ...formData, duration: value });
                          const error = validateDuration(value);
                          setFormErrors(prev => ({
                            ...prev,
                            duration: error || undefined
                          }));
                        }}
                        className={`input-field ${
                          formErrors.duration ? "border-red-500" : ""
                        }`}
                        placeholder="1-24 hours"
                      />
                      {formErrors.duration && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.duration}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categories *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {categories
                        .filter((c) => c.isActive)
                        .map((category) => (
                          <label
                            key={category._id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.categories.includes(
                                category._id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    categories: [
                                      ...formData.categories,
                                      category._id,
                                    ],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    categories: formData.categories.filter(
                                      (id) => id !== category._id
                                    ),
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 font-sans">
                              {category.name}
                            </span>
                          </label>
                        ))}
                    </div>
                    {formErrors.categories && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.categories}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sponsors
                    </label>
                    {sponsors.length === 0 ? (
                      <p className="text-sm text-gray-500 mt-2">
                        No sponsors available. Create sponsors first.
                      </p>
                    ) : (
                      <div className="relative" ref={sponsorDropdownRef}>
                        <button
                          type="button"
                          onClick={() =>
                            setSponsorDropdownOpen(!sponsorDropdownOpen)
                          }
                          className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">
                            {formData.sponsors.length === 0
                              ? "Select sponsors..."
                              : `${formData.sponsors.length} sponsor${
                                  formData.sponsors.length > 1 ? "s" : ""
                                } selected`}
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              sponsorDropdownOpen ? "transform rotate-180" : ""
                            }`}
                          />
                        </button>

                        {sponsorDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2">
                              {sponsors.map((sponsor) => {
                                const isSelected = formData.sponsors.includes(
                                  sponsor._id
                                );
                                return (
                                  <label
                                    key={sponsor._id}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <div className="relative flex items-center justify-center w-4 h-4">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                          handleSponsorToggle(sponsor._id)
                                        }
                                        className="w-4 h-4 rounded border-2 border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer appearance-none checked:bg-primary-600 checked:border-primary-600 bg-white"
                                      />
                                      {isSelected && (
                                        <Check
                                          className="absolute w-3 h-3 text-white pointer-events-none"
                                          strokeWidth={3}
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium text-gray-900 font-sans">
                                        {sponsor.name}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        ({sponsor.type})
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {formData.sponsors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.sponsors.map((sponsorId) => {
                          const sponsor = sponsors.find(
                            (s) => s._id === sponsorId
                          );
                          if (!sponsor) return null;
                          return (
                            <span
                              key={sponsorId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs font-medium"
                            >
                              {sponsor.name}
                              <button
                                type="button"
                                onClick={() => handleSponsorToggle(sponsorId)}
                                className="hover:text-primary-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Event Banners
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Banner Images (Optional - Max 10 images, 10MB each, Minimum 1600x900px)
                    </label>

                    {/* Image Previews */}
                    {bannerPreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {bannerPreviews.map((item, index) => {
                          const previewUrl = typeof item === 'string' ? item : (item.preview || item);
                          return (
                          <div key={index} className="relative group">
                            <img
                              src={previewUrl}
                              alt={`Banner ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeBanner(index)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Upload Area */}
                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      formErrors.banners ? 'border-red-500' : 'border-gray-300'
                    }`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 font-sans">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 font-sans">
                          PNG, JPG, GIF, WEBP (MAX. 10MB each, up to 10 images, Minimum 1600x900px)
                        </p>
                      </div>
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        multiple
                        onChange={handleBannerChange}
                      />
                    </label>
                    {formErrors.banners && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.banners}
                      </p>
                    )}
                    {bannerFiles.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600 font-sans">
                        {bannerFiles.length} image
                        {bannerFiles.length > 1 ? "s" : ""} selected
                      </p>
                    )}
                    
                    {/* Add More Banner Images Button */}
                    {bannerPreviews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="mt-3 btn-secondary text-sm inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add More Banner Images
                      </button>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Address
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Address *
                    </label>
                    <textarea
                      value={formData.address.fullAddress}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            fullAddress: e.target.value,
                          },
                        });
                        // Clear error when user starts typing
                        if (formErrors.fullAddress && e.target.value.trim()) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.fullAddress;
                            return newErrors;
                          });
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (!formData.address.fullAddress.trim()) {
                          setFormErrors(prev => ({
                            ...prev,
                            fullAddress: "Full address is required"
                          }));
                        }
                      }}
                      className={`input-field min-h-[80px] ${
                        formErrors.fullAddress ? "border-red-500" : ""
                      }`}
                      rows={3}
                    />
                    {formErrors.fullAddress && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.fullAddress}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <select
                        value={formData.address.state}
                        onChange={(e) => {
                          const newState = e.target.value;
                          setFormData({
                            ...formData,
                            address: {
                              ...formData.address,
                              state: newState,
                              city: '', // Reset city when state changes
                            },
                          });
                          // Clear errors when user selects a state
                          if (formErrors.state && newState) {
                            setFormErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.state;
                              delete newErrors.city; // Also clear city error
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => {
                          // Validate on blur
                          if (!formData.address.state) {
                            setFormErrors(prev => ({
                              ...prev,
                              state: "State is required"
                            }));
                          }
                        }}
                        className={`input-field ${
                          formErrors.state ? "border-red-500" : ""
                        }`}
                      >
                        <option value="">Select State</option>
                        {Object.keys(stateCityMap).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {formErrors.state && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.state}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <select
                        value={formData.address.city}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            address: {
                              ...formData.address,
                              city: e.target.value,
                            },
                          });
                          // Clear error when user selects a city
                          if (formErrors.city && e.target.value) {
                            setFormErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.city;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => {
                          // Validate on blur
                          if (!formData.address.city) {
                            setFormErrors(prev => ({
                              ...prev,
                              city: "City is required"
                            }));
                          }
                        }}
                        disabled={!formData.address.state}
                        className={`input-field ${
                          formErrors.city ? "border-red-500" : ""
                        } ${!formData.address.state ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      >
                        <option value="">Select City</option>
                        {formData.address.state && stateCityMap[formData.address.state]?.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      {formErrors.city && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.city}
                        </p>
                      )}
                      {!formData.address.state && (
                        <p className="text-gray-500 text-xs mt-1">
                          Please select a state first
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={formData.address.pincode}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/\D/g, '');
                          const error = validatePincode(numericValue);
                          setFormData({
                            ...formData,
                            address: {
                              ...formData.address,
                              pincode: numericValue,
                            },
                          });
                          setFormErrors(prev => ({
                            ...prev,
                            pincode: error || undefined
                          }));
                        }}
                        maxLength={6}
                        className={`input-field ${
                          formErrors.pincode ? "border-red-500" : ""
                        }`}
                        placeholder="6 digits"
                      />
                      {formErrors.pincode && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.pincode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slots */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Event Slots
                    </h3>
                    <button
                      type="button"
                      onClick={addSlot}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Slot
                    </button>
                  </div>
                  {formData.slots.map((slot, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={slot.date}
                          onChange={(e) =>
                            updateSlot(index, "date", e.target.value)
                          }
                          min={new Date().toISOString().split('T')[0]}
                          className={`input-field ${
                            formErrors[`slot_${index}_date`] ? "border-red-500" : ""
                          }`}
                        />
                        {formErrors[`slot_${index}_date`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors[`slot_${index}_date`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            updateSlot(index, "startTime", e.target.value);
                            // Clear error when user selects a time
                            if (formErrors[`slot_${index}_startTime`] && e.target.value) {
                              setFormErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[`slot_${index}_startTime`];
                                return newErrors;
                              });
                            }
                          }}
                          onBlur={() => {
                            // Validate on blur
                            if (!slot.startTime) {
                              setFormErrors(prev => ({
                                ...prev,
                                [`slot_${index}_startTime`]: "Start time is required"
                              }));
                            }
                          }}
                          className={`input-field ${
                            formErrors[`slot_${index}_startTime`] ? "border-red-500" : ""
                          }`}
                        />
                        {formErrors[`slot_${index}_startTime`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors[`slot_${index}_startTime`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time *
                        </label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => {
                            updateSlot(index, "endTime", e.target.value);
                            // Clear error when user selects a time
                            if (formErrors[`slot_${index}_endTime`] && e.target.value) {
                              setFormErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[`slot_${index}_endTime`];
                                return newErrors;
                              });
                            }
                          }}
                          onBlur={() => {
                            // Validate on blur
                            if (!slot.endTime) {
                              setFormErrors(prev => ({
                                ...prev,
                                [`slot_${index}_endTime`]: "End time is required"
                              }));
                            }
                          }}
                          className={`input-field ${
                            formErrors[`slot_${index}_endTime`] ? "border-red-500" : ""
                          }`}
                        />
                        {formErrors[`slot_${index}_endTime`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors[`slot_${index}_endTime`]}
                          </p>
                        )}
                      </div>
                      <div className="flex items-end">
                        {formData.slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(index)}
                            className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket Types */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ticket Types
                    </h3>
                    <button
                      type="button"
                      onClick={addTicketType}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Ticket Type
                    </button>
                  </div>
                  {formData.ticketTypes.map((ticketType, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={ticketType.title}
                            onChange={(e) => {
                              updateTicketType(index, "title", e.target.value);
                              // Clear error when user starts typing
                              if (formErrors[`ticket_${index}_title`] && e.target.value.trim()) {
                                setFormErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`ticket_${index}_title`];
                                  return newErrors;
                                });
                              }
                            }}
                            onBlur={() => {
                              // Validate on blur
                              if (!ticketType.title.trim()) {
                                setFormErrors(prev => ({
                                  ...prev,
                                  [`ticket_${index}_title`]: "Ticket title is required"
                                }));
                              }
                            }}
                            className={`input-field ${
                              formErrors[`ticket_${index}_title`] ? "border-red-500" : ""
                            }`}
                            placeholder="e.g., General"
                          />
                          {formErrors[`ticket_${index}_title`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors[`ticket_${index}_title`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="text"
                            value={ticketType.price}
                            onChange={(e) => {
                              updateTicketType(index, "price", e.target.value);
                              // Clear error when user starts typing
                              const priceValue = parseFloat(e.target.value);
                              if (formErrors[`ticket_${index}_price`] && priceValue > 0) {
                                setFormErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`ticket_${index}_price`];
                                  return newErrors;
                                });
                              }
                            }}
                            onBlur={() => {
                              // Validate on blur
                              if (!ticketType.price || parseFloat(ticketType.price) <= 0) {
                                setFormErrors(prev => ({
                                  ...prev,
                                  [`ticket_${index}_price`]: "Valid price is required"
                                }));
                              }
                            }}
                            className={`input-field ${
                              formErrors[`ticket_${index}_price`] ? "border-red-500" : ""
                            }`}
                            placeholder="0.00"
                          />
                          {formErrors[`ticket_${index}_price`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors[`ticket_${index}_price`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Quantity
                          </label>
                          <input
                            type="text"
                            value={ticketType.totalQuantity}
                            onChange={(e) => {
                              updateTicketType(
                                index,
                                "totalQuantity",
                                e.target.value
                              );
                              updateTicketType(
                                index,
                                "availableQuantity",
                                e.target.value
                              );
                              // Clear error when user starts typing
                              const qtyValue = parseInt(e.target.value);
                              if (formErrors[`ticket_${index}_totalQuantity`] && qtyValue > 0) {
                                setFormErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`ticket_${index}_totalQuantity`];
                                  return newErrors;
                                });
                              }
                            }}
                            onBlur={() => {
                              // Validate on blur
                              if (!ticketType.totalQuantity || parseInt(ticketType.totalQuantity) <= 0) {
                                setFormErrors(prev => ({
                                  ...prev,
                                  [`ticket_${index}_totalQuantity`]: "Valid total quantity is required"
                                }));
                              }
                            }}
                            className={`input-field ${
                              formErrors[`ticket_${index}_totalQuantity`] ? "border-red-500" : ""
                            }`}
                            placeholder="0"
                          />
                          {formErrors[`ticket_${index}_totalQuantity`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors[`ticket_${index}_totalQuantity`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Available
                          </label>
                          <input
                            type="text"
                            value={ticketType.availableQuantity}
                            onChange={(e) =>
                              updateTicketType(
                                index,
                                "availableQuantity",
                                e.target.value
                              )
                            }
                            className={`input-field ${
                              formErrors[`ticket_${index}_availableQuantity`] ? "border-red-500" : ""
                            }`}
                            placeholder="0"
                          />
                          {formErrors[`ticket_${index}_availableQuantity`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors[`ticket_${index}_availableQuantity`]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-end">
                          {formData.ticketTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTicketType(index)}
                              className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          value={ticketType.description || ''}
                          onChange={(e) => updateTicketType(index, "description", e.target.value)}
                          placeholder="Enter ticket description..."
                          rows={2}
                          className="input-field"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms and Conditions *
                  </label>
                  <textarea
                    value={formData.termsAndConditions}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        termsAndConditions: e.target.value,
                      });
                      // Clear error when user starts typing
                      if (formErrors.termsAndConditions && e.target.value.trim()) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.termsAndConditions;
                          return newErrors;
                        });
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (!formData.termsAndConditions.trim()) {
                        setFormErrors(prev => ({
                          ...prev,
                          termsAndConditions: "Terms and conditions are required"
                        }));
                      }
                    }}
                    className={`input-field min-h-[100px] ${
                      formErrors.termsAndConditions ? "border-red-500" : ""
                    }`}
                    rows={4}
                  />
                  {formErrors.termsAndConditions && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.termsAndConditions}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes *
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        notes: e.target.value,
                      });
                      // Clear error when user starts typing
                      if (formErrors.notes && e.target.value.trim()) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.notes;
                          return newErrors;
                        });
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (!formData.notes || !formData.notes.trim()) {
                        setFormErrors(prev => ({
                          ...prev,
                          notes: "Notes are required"
                        }));
                      }
                    }}
                    className={`input-field min-h-[100px] ${
                      formErrors.notes ? "border-red-500" : ""
                    }`}
                    rows={3}
                  />
                  {formErrors.notes && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.notes}
                    </p>
                  )}
                </div>

                {/* Event Detail Image */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Detail Image * (Single Image - Portrait Orientation)
                    </label>
                    <input
                      ref={eventDetailImageFileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleEventDetailImageChange}
                      className={`input-field ${formErrors.eventDetailImage ? "border-red-500" : ""}`}
                      required={!showEditModal || (!existingEventDetailImage && !newEventDetailImageFile)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a single portrait image (height &gt; width) - PNG, JPG, GIF, WEBP (MAX. 10MB)
                    </p>
                    {formErrors.eventDetailImage && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.eventDetailImage}
                      </p>
                    )}
                  </div>

                  {/* Existing Event Detail Image Preview (Edit Mode) */}
                  {showEditModal && selectedEventForEdit && existingEventDetailImage && !newEventDetailImagePreview && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Event Detail Image
                      </label>
                      <div className="relative group inline-block">
                        <img
                          src={existingEventDetailImage}
                          alt="Existing event detail image"
                          className="w-48 h-96 object-contain rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeExistingEventDetailImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-b-lg">
                          Current
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Event Detail Image Preview */}
                  {newEventDetailImagePreview && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Event Detail Image
                      </label>
                      <div className="relative group inline-block">
                        <img
                          src={newEventDetailImagePreview}
                          alt="New event detail image"
                          className="w-48 h-96 object-contain rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeNewEventDetailImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/50 text-white text-xs px-2 py-1 rounded-b-lg">
                          New
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Images */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Images (Optional)
                    </label>
                    <input
                      ref={eventImageFileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleEventImageChange}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can upload multiple event images
                    </p>
                  </div>

                  {/* Existing Event Images Preview (Edit Mode) */}
                  {showEditModal && selectedEventForEdit && existingEventImages.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Existing Event Images
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingEventImages.map((image, index) => {
                          const imageUrl = image.startsWith('http') 
                            ? image 
                            : `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "")}${image}`;
                          return (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Existing event image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingEventImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-b-lg">
                                Existing
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* New Event Images Preview */}
                  {newEventImagePreviews.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Event Images
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {newEventImagePreviews.map((item, index) => {
                          const previewUrl = typeof item === 'string' ? item : (item.preview || item);
                          return (
                          <div key={index} className="relative group">
                            <img
                              src={previewUrl}
                              alt={`New event image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewEventImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-green-600/50 text-white text-xs px-2 py-1 rounded-b-lg">
                              New
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white sticky bottom-0 z-10 rounded-b-2xl">
              <div className="flex gap-3 p-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedEventForEdit(null);
                    setBannerFiles([]);
                    setBannerPreviews([]);
                    setExistingEventImages([]);
                    setNewEventImageFiles([]);
                    setNewEventImagePreviews([]);
                    setExistingEventDetailImage(null);
                    setNewEventDetailImageFile(null);
                    setNewEventDetailImagePreview(null);
                    setFormData({
                      title: "",
                      description: "",
                      categories: [],
                      sponsors: [],
                      organizerId: "",
                      duration: "",
                      address: {
                        fullAddress: "",
                        city: "",
                        state: "",
                        pincode: "",
                      },
                      slots: [{ date: "", startTime: "", endTime: "" }],
                      ticketTypes: [
                        {
                          title: "",
                          price: "",
                          totalQuantity: "",
                          availableQuantity: "",
                        },
                      ],
                      termsAndConditions: "",
                      notes: "",
                    });
                    setFormErrors({});
                  }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="event-form"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting
                    ? showEditModal
                      ? "Updating..."
                      : "Creating..."
                    : showEditModal
                    ? "Update Event"
                    : "Create Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
