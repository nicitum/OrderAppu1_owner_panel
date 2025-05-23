import React, { useState, useEffect, useRef } from "react";
import {
  getProducts,
  addProduct,
  updateProductsByBrand,
  updateProduct,
  globalPriceUpdate,
  uploadProductImage,
  getImageUrl,
  fetchProductImage,
  readLocalFile,
  getBrands,
  getCategories,
  getUOMs,
  createBrand,
  createCategory,
  createUOM
} from "../services/api";
import { Plus, Edit, Package, Image as ImageIcon, Upload } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import * as XLSX from 'xlsx';

// Placeholder image as a data URL
const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-size="12" text-anchor="middle" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E';

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProductEditModal, setShowProductEditModal] = useState(false);
  const [showImageChangeModal, setShowImageChangeModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [productPrefix, setProductPrefix] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUOMModal, setShowUOMModal] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUOM, setNewUOM] = useState("");

  const [newProduct, setNewProduct] = useState({
    product_code: "",
    name: "",
    brand: "",
    category: "",
    mrp: "",
    selling_price: "",
    hsn_code: "",
    gst_rate: "",
    alias: "",
    part_number: "",
    stock_group: "",
    unit_of_measure: "",
    type_of_supply: "",
    maintain_batches: "",
    stock_quantity: 0
  });
  
  const [currentProduct, setCurrentProduct] = useState({
    id: "",
    product_code: "",
    name: "",
    brand: "",
    category: "",
    mrp: "",
    selling_price: "",
    hsn_code: "",
    gst_rate: "",
    image: "",
    alias: "",
    part_number: "",
    stock_group: "",
    unit_of_measure: "",
    type_of_supply: "",
    maintain_batches: "",
    stock_quantity: 0
  });
  
  const [imageFiles, setImageFiles] = useState({});
  const [loadedImages, setLoadedImages] = useState({});
  const fileInputRef = useRef(null);

  // Fetch product prefix and generate next product code
  const fetchProductPrefix = async () => {
    try {
      const [prefixResponse, productsResponse] = await Promise.all([
        axios.get('http://147.93.110.150:3001/api/client_status/APPU0009'),
        getProducts()
      ]);

      if (prefixResponse.data.success && prefixResponse.data.data.length > 0) {
        const prefix = prefixResponse.data.data[0].product_prefix;
        setProductPrefix(prefix);

        // Find the highest existing product code number
        const prefixProducts = productsResponse.filter(product => 
          product.product_code && product.product_code.startsWith(prefix)
        );
        
        const numbers = prefixProducts.map(product => {
          const num = parseInt(product.product_code.replace(prefix, ''));
          return isNaN(num) ? 0 : num;
        });
        
        const maxNumber = Math.max(0, ...numbers);
        const nextNumber = maxNumber + 1;
        
        // Set the new product code with incremented number
        setNewProduct(prev => ({
          ...prev,
          product_code: `${prefix}${nextNumber.toString().padStart(4, '0')}`
        }));
      }
    } catch (error) {
      console.error("Error fetching product prefix:", error);
      toast.error("Failed to fetch product prefix");
    }
  };

  useEffect(() => {
    fetchProductPrefix();
  }, []);

  // Generate product code with prefix
  const generateProductCode = async () => {
    try {
      // Get all products to find the highest number
      const allProducts = await getProducts();
      
      // Filter products with the given prefix and extract numbers
      const prefixProducts = allProducts.filter(product => product.product_code.startsWith(productPrefix));
      const numbers = prefixProducts.map(product => {
        const num = parseInt(product.product_code.replace(productPrefix, ''));
        return isNaN(num) ? 0 : num;
      });
      
      // Find the highest number and increment by 1
      const maxNumber = Math.max(0, ...numbers);
      const nextNumber = maxNumber + 1;
      
      // Format the number with leading zeros (4 digits)
      return `${productPrefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Error generating product code:", error);
      toast.error("Failed to generate product code");
      return `${productPrefix}0001`; // Fallback to 0001 if there's an error
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      for (const product of products) {
        if (product.image && !loadedImages[product.id]) {
          try {
            // First try the direct URL
            const imageUrl = getImageUrl(product.image);
            if (imageUrl) {
              const img = new Image();
              img.src = imageUrl;
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = async () => {
                  try {
                    // If direct URL fails, try fetching through the API
                    const blobUrl = await fetchProductImage(product.image);
                    setLoadedImages(prev => ({
                      ...prev,
                      [product.id]: blobUrl
                    }));
                    resolve();
                  } catch (err) {
                    console.error(`Failed to load image for product ${product.id}:`, err);
                    reject(err);
                  }
                };
              });
            }
          } catch (error) {
            console.error(`Failed to load image for product ${product.id}:`, error);
          }
        }
      }
    };
    loadImages();
  }, [products]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  const validateForm = (productData) => {
    const errors = {};
    if (!productData.product_code) errors.product_code = "Product Code is required";
    if (!productData.name) errors.name = "Name is required";
    if (!productData.stock_group) errors.stock_group = "Stock Group is required";
    if (!productData.unit_of_measure) errors.unit_of_measure = "Unit of Measure is required";
    if (!productData.gst_rate) errors.gst_rate = "GST Rate is required";
    if (!productData.type_of_supply) errors.type_of_supply = "Type of Supply is required";
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!validateForm(newProduct)) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const productCode = await generateProductCode();
      const currentDate = new Date().toISOString();

      await addProduct({
        product_code: productCode,
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        price: newProduct.mrp ? parseFloat(newProduct.mrp) : null,
        discountPrice: newProduct.selling_price ? parseFloat(newProduct.selling_price) : null,
        created_at: currentDate,
        updated_at: currentDate,
        hsn_code: newProduct.hsn_code,
        gst_rate: newProduct.gst_rate ? parseFloat(newProduct.gst_rate) : null,
        alias: newProduct.alias,
        part_number: newProduct.part_number,
        stock_group: newProduct.stock_group,
        uom: newProduct.unit_of_measure,
        type_of_supply: newProduct.type_of_supply,
        maintain_batches: newProduct.maintain_batches === "Yes",
        stock_quantity: newProduct.stock_quantity ? parseInt(newProduct.stock_quantity) : 0
      });

      await fetchProducts();
      setShowAddModal(false);
      setNewProduct({
        product_code: "",
        name: "",
        brand: "",
        category: "",
        mrp: "",
        selling_price: "",
        hsn_code: "",
        gst_rate: "",
        alias: "",
        part_number: "",
        stock_group: "",
        unit_of_measure: "",
        type_of_supply: "",
        maintain_batches: "",
        stock_quantity: 0
      });
      setErrors({});
      toast.success("Product added successfully");
    } catch (error) {
      toast.error("Failed to add product");
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!validateForm(currentProduct)) {
      toast.error("Please check the form");
      return;
    }
    try {
      const currentDate = new Date().toISOString();
      const updateData = {
        product_code: currentProduct.product_code,
        name: currentProduct.name,
        brand: currentProduct.brand,
        category: currentProduct.category,
        price: currentProduct.mrp ? parseFloat(currentProduct.mrp) : null,
        discountPrice: currentProduct.selling_price ? parseFloat(currentProduct.selling_price) : null,
        updated_at: currentDate,
        hsn_code: currentProduct.hsn_code,
        gst_rate: currentProduct.gst_rate ? parseFloat(currentProduct.gst_rate) : null,
        alias: currentProduct.alias,
        part_number: currentProduct.part_number,
        stock_group: currentProduct.stock_group,
        uom: currentProduct.unit_of_measure,
        type_of_supply: currentProduct.type_of_supply,
        maintain_batches: currentProduct.maintain_batches === "Yes",
        stock_quantity: currentProduct.stock_quantity ? parseInt(currentProduct.stock_quantity) : 0
      };

      // Debug logging
      console.log('Current Product State:', currentProduct);
      console.log('Update Data being sent:', updateData);
      console.log('Product ID:', currentProduct.id);

      // Validate required fields before sending
      if (!updateData.name || !updateData.category || !updateData.price) {
        console.error('Missing required fields:', {
          name: !updateData.name,
          category: !updateData.category,
          price: !updateData.price
        });
        toast.error("Missing required fields: name, category, or price");
        return;
      }

      const response = await updateProduct(currentProduct.id, updateData);
      console.log('Update response:', response);

      if (currentProduct.selling_price) {
        await globalPriceUpdate(
          currentProduct.id,
          parseFloat(currentProduct.selling_price)
        );
      }
      await fetchProducts();
      setShowProductEditModal(false);
      setErrors({});
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Failed to update product:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || "Failed to update product");
    }
  };

  const handleImageFilesChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFiles(prev => ({
        ...prev,
        [currentProduct.id]: file
      }));
    }
  };

  const handleImageChange = async (e) => {
    e.preventDefault();
    try {
      const selectedFile = imageFiles[currentProduct.id];
      if (!selectedFile) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      await uploadProductImage(currentProduct.id, selectedFile);
      
      // Update the loaded images state immediately
      const imageUrl = URL.createObjectURL(selectedFile);
      setLoadedImages(prev => ({
        ...prev,
        [currentProduct.id]: imageUrl
      }));

      await fetchProducts();
      setShowImageChangeModal(false);
      setImageFiles({});
      toast.success("Product image updated successfully");
    } catch (error) {
      console.error("Error updating image:", error);
      toast.error("Failed to update product image");
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error("Please select an Excel file");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          let hadError = false;

          // Convert imageFiles object to array for bulk upload
          const imageFilesArray = Object.values(imageFiles);

          for (const row of jsonData) {
            try {
              // Check for required fields
              const requiredFields = {
                name: 'Product Name',
                category: 'Category',
                mrp: 'MRP',
                stock_group: 'Stock Group',
                type_of_supply: 'Type of Supply'
              };

              const missingFields = Object.entries(requiredFields)
                .filter(([field]) => !row[field])
                .map(([_, label]) => label);

              if (missingFields.length > 0) {
                console.error('Missing required fields:', missingFields);
                toast.error(`Missing required fields in row ${row.__rowNum__}: ${missingFields.join(', ')}`);
                hadError = true;
                continue;
              }

              const currentDate = new Date().toISOString();
              const productData = {
                product_code: row.product_code || await generateProductCode(),
                name: row.name,
                brand: row.brand || "",
                category: row.category,
                price: row.mrp ? parseFloat(row.mrp) : null,
                discountPrice: row.selling_price ? parseFloat(row.selling_price) : null,
                created_at: currentDate,
                updated_at: currentDate,
                hsn_code: row.hsn_code || "",
                gst_rate: row.gst_rate ? parseFloat(row.gst_rate) : null,
                alias: row.alias || "",
                part_number: row.part_number || "",
                stock_group: row.stock_group,
                uom: row.unit_of_measure || "PCS",
                type_of_supply: row.type_of_supply,
                maintain_batches: row.maintain_batches === "Yes",
                stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : 0
              };

              const addedProduct = await addProduct(productData);

              // Match image file by filename (case-insensitive)
              let imageFile = null;
              if (row.image_name) {
                imageFile = imageFilesArray.find(
                  file => file.name.toLowerCase() === row.image_name.toLowerCase()
                );
              }

              // Extract productId robustly from backend response
              let productId = null;
              if (addedProduct) {
                productId = addedProduct.productId || addedProduct.id || addedProduct.insertId || addedProduct.data?.productId || addedProduct.data?.id || addedProduct.data?.insertId;
              }

              // If image file found and productId exists, upload image
              if (imageFile && productId) {
                try {
                  await uploadProductImage(productId, imageFile);
                  console.log(`Successfully uploaded image for product ${row.name}`);
                } catch (imgErr) {
                  hadError = true;
                  console.error('Image upload failed:', imgErr);
                  toast.error(`Failed to upload image for product ${row.name}`);
                }
              } else if (row.image_name) {
                console.warn(`Image file not found for product ${row.name}: ${row.image_name}`);
              }
            } catch (err) {
              hadError = true;
              console.error('Product row upload failed:', err);
              toast.error(`Failed to upload product: ${row.name}`);
            }
          }
          await fetchProducts();
          setShowBulkUploadModal(false);
          setExcelFile(null);
          setImageFiles({});
          setUploading(false);
          if (hadError) {
            toast.success("Products uploaded, but some items may have failed. Check the console for details.");
          } else {
            toast.success("Products and images uploaded successfully");
          }
        } catch (err) {
          setUploading(false);
          toast.error("Failed to process Excel file");
          console.error('Bulk upload failed:', err);
        }
      };
      reader.readAsArrayBuffer(excelFile);
    } catch (err) {
      toast.error("Failed to read Excel file");
      setUploading(false);
      console.error('Bulk upload read error:', err);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        product_code: "AUTO-GENERATED",
        name: "Product Name",
        brand: "Brand Name",
        category: "Category",
        mrp: "1000",
        selling_price: "900",
        hsn_code: "HSN Code",
        gst_rate: "18",
        alias: "Alias",
        part_number: "Part Number",
        stock_group: "Stock Group",
        unit_of_measure: "PCS",
        type_of_supply: "Goods",
        maintain_batches: "Yes",
        stock_quantity: "100",
        image_name: "image_name.jpg/png"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "product_upload_template.xlsx");
  };

  // Add new useEffect to fetch brands, categories, and units
  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      // Fetch brands
      const brandsResponse = await getBrands();
      console.log('Raw Brands Response:', brandsResponse);
      
      if (brandsResponse && brandsResponse.data) {
        const brandsData = brandsResponse.data;
        console.log('Brands Data before setting:', brandsData);
        
        // Ensure we're setting an array of objects with id and name
        const formattedBrands = brandsData.map(brand => ({
          id: brand.id,
          name: brand.name
        }));
        
        console.log('Formatted Brands:', formattedBrands);
        setBrands(formattedBrands);
      } else {
        console.error('Invalid brands response:', brandsResponse);
      }

      // Fetch categories
      const categoriesResponse = await getCategories();
      console.log('Categories Response:', categoriesResponse);
      if (categoriesResponse.success) {
        const categoriesData = categoriesResponse.data || [];
        console.log('Categories Data:', categoriesData);
        setCategories(categoriesData);
      }

      // Fetch units
      const unitsResponse = await getUOMs();
      console.log('Units Response:', unitsResponse);
      if (unitsResponse.success) {
        const unitsData = unitsResponse.data || [];
        console.log('Units Data:', unitsData);
        setUnits(unitsData);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to fetch master data");
    }
  };

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('Current Brands:', brands);
    console.log('Current Categories:', categories);
    console.log('Current Units:', units);
  }, [brands, categories, units]);

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    try {
      await createBrand(newBrand);
      await fetchMasterData(); // Refresh the data
      setShowBrandModal(false);
      setNewBrand("");
      toast.success("Brand created successfully");
    } catch (error) {
      toast.error("Failed to create brand");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(newCategory);
      await fetchMasterData(); // Refresh the data
      setShowCategoryModal(false);
      setNewCategory("");
      toast.success("Category created successfully");
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleCreateUOM = async (e) => {
    e.preventDefault();
    try {
      await createUOM(newUOM);
      await fetchMasterData(); // Refresh the data
      setShowUOMModal(false);
      setNewUOM("");
      toast.success("Unit of Measure created successfully");
    } catch (error) {
      toast.error("Failed to create Unit of Measure");
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#003366]">
            Product Management
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, or brand..."
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
              >
                <option value="">All Brands</option>
                {Array.isArray(brands) && brands.length > 0 ? (
                  brands.map((brand) =>
                    typeof brand === 'string' ? (
                      <option key={brand} value={brand}>{brand}</option>
                    ) : (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    )
                  )
                ) : (
                  <option value="" disabled>No brands available</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
              >
                <option value="">All Categories</option>
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((category) =>
                    typeof category === 'string' ? (
                      <option key={category} value={category}>{category}</option>
                    ) : (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    )
                  )
                ) : (
                  <option value="" disabled>No categories available</option>
                )}
              </select>
            </div>
          </div>
          {selectedBrand && (
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
              >
                Edit {selectedBrand} Products
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products
            .filter(
              (product) =>
                (!selectedBrand || product.brand === selectedBrand) &&
                (!selectedCategory || product.category === selectedCategory) &&
                (!searchQuery || 
                  product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={loadedImages[product.id] || getImageUrl(product.image)}
                      alt={product.name}
                      className="h-full w-full object-contain"
                      onError={async (e) => {
                        console.log(`Attempting to load image for ${product.name} via API`);
                        try {
                          const blobUrl = await fetchProductImage(product.image);
                          setLoadedImages(prev => ({
                            ...prev,
                            [product.id]: blobUrl
                          }));
                        } catch (err) {
                          console.error(`Failed to load image for ${product.name}:`, err);
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <ImageIcon className="h-10 w-10" />
                      <span className="text-sm mt-2">No image available</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#003366]">
                    {product.name}
                  </h3>
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Brand: {product.brand}
                  </p>
                  <p className="text-sm text-gray-600">
                    Category: {product.category}
                  </p>
                  <p className="text-sm text-gray-600">
                    Product Code: {product.product_code}
                  </p>
                  <p className="text-lg font-bold text-[#003366]">
                    MRP: ₹{product.price}
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    Selling Price: ₹{product.discountPrice}
                  </p>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <ImageIcon className="h-5 w-5 text-[#003366] mr-2" />
                    <span className="text-sm text-gray-600">Product Image</span>
                  </div>
                  <button
                    className="text-[#003366] hover:underline text-sm"
                    onClick={() => {
                      setCurrentProduct(product);
                      setShowImageChangeModal(true);
                    }}
                  >
                    Change
                  </button>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setCurrentProduct({
                        ...product,
                        mrp: product.price,
                        selling_price: product.discountPrice,
                        unit_of_measure: product.uom || product.unit_of_measure,
                        maintain_batches: product.maintain_batches ? "Yes" : "No"
                      });
                      setShowViewDetailsModal(true);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Display
                  </button>
                  <button
                    onClick={() => {
                      setCurrentProduct({
                        ...product,
                        mrp: product.price,
                        selling_price: product.discountPrice,
                        unit_of_measure: product.uom || product.unit_of_measure,
                        maintain_batches: product.maintain_batches ? "Yes" : "No"
                      });
                      setShowProductEditModal(true);
                    }}
                    className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                  >
                    <Edit className="h-5 w-5 inline mr-2" />
                    Alter
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Add New Product
              </h3>
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    placeholder="Enter product name"
                    className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors ${errors.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alias
                    </label>
                    <input
                      type="text"
                      value={newProduct.alias}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, alias: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={newProduct.part_number}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, part_number: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code *
                    </label>
                    <input
                      type="text"
                      value={newProduct.product_code}
                      disabled
                      className="block w-full rounded-lg border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">Auto-generated field</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={newProduct.brand}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, brand: e.target.value })
                        }
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                      >
                        <option value="">Select Brand</option>
                        {Array.isArray(brands) && brands.length > 0 ? (
                          brands.map((brand) => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No brands available</option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowBrandModal(true)}
                        className="px-2 py-1 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={newProduct.category}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, category: e.target.value })
                        }
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                      >
                        <option value="">Select Category</option>
                        {Array.isArray(categories) && categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="px-2 py-1 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MRP *
                    </label>
                    <input
                      type="number"
                      value={newProduct.mrp}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, mrp: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price *
                    </label>
                    <input
                      type="number"
                      value={newProduct.selling_price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, selling_price: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={newProduct.hsn_code}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, hsn_code: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Rate *
                    </label>
                    <input
                      type="number"
                      value={newProduct.gst_rate}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, gst_rate: e.target.value })
                      }
                      className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors ${errors.gst_rate ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.gst_rate && (
                      <p className="mt-1 text-sm text-red-600">{errors.gst_rate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Group *
                    </label>
                    <input
                      type="text"
                      value={newProduct.stock_group}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock_group: e.target.value })
                      }
                      className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors ${errors.stock_group ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.stock_group && (
                      <p className="mt-1 text-sm text-red-600">{errors.stock_group}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit of Measure *
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={newProduct.unit_of_measure}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, unit_of_measure: e.target.value })
                        }
                        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors ${errors.unit_of_measure ? 'border-red-500' : ''}`}
                        required
                      >
                        <option value="">Select Unit</option>
                        {Array.isArray(units) && units.length > 0 ? (
                          units.map((unit) =>
                            typeof unit === 'string' ? (
                              <option key={unit} value={unit}>{unit}</option>
                            ) : (
                              <option key={unit.id} value={unit.name}>{unit.name}</option>
                            )
                          )
                        ) : (
                          <option value="" disabled>No units available</option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowUOMModal(true)}
                        className="px-2 py-1 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    {errors.unit_of_measure && (
                      <p className="mt-1 text-sm text-red-600">{errors.unit_of_measure}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock_quantity: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type of Supply *
                    </label>
                    <select
                      value={newProduct.type_of_supply}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, type_of_supply: e.target.value })
                      }
                      className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors ${errors.type_of_supply ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value="">Select Type of Supply</option>
                      <option value="Goods">Goods</option>
                      <option value="Services">Services</option>
                    </select>
                    {errors.type_of_supply && (
                      <p className="mt-1 text-sm text-red-600">{errors.type_of_supply}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setErrors({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showProductEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Edit Product
              </h3>
              <form onSubmit={handleEditProduct} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={currentProduct.name}
                    onChange={(e) =>
                      setCurrentProduct({ ...currentProduct, name: e.target.value })
                    }
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alias
                    </label>
                    <input
                      type="text"
                      value={currentProduct.alias}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, alias: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={currentProduct.part_number}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, part_number: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code
                    </label>
                    <input
                      type="text"
                      value={currentProduct.product_code}
                      disabled
                      className="block w-full rounded-lg border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-sm text-gray-500">Auto-generated field</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={currentProduct.brand}
                        onChange={(e) =>
                          setCurrentProduct({ ...currentProduct, brand: e.target.value })
                        }
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                      >
                        <option value="">Select Brand</option>
                        {Array.isArray(brands) && brands.map((brand) => (
                          <option key={brand.id} value={brand.name}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowBrandModal(true)}
                        className="px-2 py-1 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={currentProduct.category}
                        onChange={(e) =>
                          setCurrentProduct({ ...currentProduct, category: e.target.value })
                        }
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                      >
                        <option value="">Select Category</option>
                        {Array.isArray(categories) && categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="px-2 py-1 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MRP
                    </label>
                    <input
                      type="number"
                      value={currentProduct.mrp}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, mrp: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      value={currentProduct.selling_price}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, selling_price: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={currentProduct.hsn_code}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, hsn_code: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Rate
                    </label>
                    <input
                      type="number"
                      value={currentProduct.gst_rate}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, gst_rate: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Group
                    </label>
                    <input
                      type="text"
                      value={currentProduct.stock_group}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, stock_group: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit of Measure
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={currentProduct.unit_of_measure}
                        onChange={(e) =>
                          setCurrentProduct({ ...currentProduct, unit_of_measure: e.target.value })
                        }
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                      >
                        <option value="">Select Unit</option>
                        {Array.isArray(units) && units.length > 0 ? (
                          units.map((unit) =>
                            typeof unit === 'string' ? (
                              <option key={unit} value={unit}>{unit}</option>
                            ) : (
                              <option key={unit.id} value={unit.name}>{unit.name}</option>
                            )
                          )
                        ) : (
                          <option value="" disabled>No units available</option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowUOMModal(true)}
                        className="px-2 py-1 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintain Batches
                    </label>
                    <select
                      value={currentProduct.maintain_batches}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, maintain_batches: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    >
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={currentProduct.stock_quantity}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, stock_quantity: e.target.value })
                      }
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type of Supply *
                    </label>
                    <select
                      value={currentProduct.type_of_supply}
                      onChange={(e) =>
                        setCurrentProduct({ ...currentProduct, type_of_supply: e.target.value })
                      }
                      className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors ${errors.type_of_supply ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value="">Select Type of Supply</option>
                      <option value="Goods">Goods</option>
                      <option value="Services">Services</option>
                    </select>
                    {errors.type_of_supply && (
                      <p className="mt-1 text-sm text-red-600">{errors.type_of_supply}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductEditModal(false);
                      setErrors({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Image Modal */}
        {showImageChangeModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Change Product Image
              </h3>
              <form onSubmit={handleImageChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFilesChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
                {currentProduct.image && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Current Image:</p>
                    <img
                      src={loadedImages[currentProduct.id] || getImageUrl(currentProduct.image)}
                      alt="Current product"
                      className="mt-2 h-32 object-contain border rounded"
                      onError={(e) => {
                        console.error(`Failed to load image for ${currentProduct.name}:`, e);
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                  </div>
                )}
                {imageFiles[currentProduct.id] && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">New Image Preview:</p>
                    <img
                      src={URL.createObjectURL(imageFiles[currentProduct.id])}
                      alt="New product"
                      className="mt-2 h-32 object-contain border rounded"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageChangeModal(false);
                      setImageFiles({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Update Image
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Bulk Upload Products
              </h3>
              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setExcelFile(file);
                      }
                    }}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload Excel file with product details and image filenames (not paths)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images (select multiple)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Select all images referenced in the Excel file. Filenames must match exactly.
                  </p>
                  {Object.keys(imageFiles).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      {Object.keys(imageFiles).length} image(s) selected
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="text-[#003366] hover:underline text-sm"
                  >
                    Download Template
                  </button>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkUploadModal(false);
                      setExcelFile(null);
                      setImageFiles({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload Products"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewDetailsModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-[#003366] mb-6">
                Product Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <p className="text-gray-900 text-lg font-semibold">{currentProduct.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alias
                  </label>
                  <p className="text-gray-900">{currentProduct.alias}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Part Number
                  </label>
                  <p className="text-gray-900">{currentProduct.part_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Code
                  </label>
                  <p className="text-gray-900">{currentProduct.product_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <p className="text-gray-900">{currentProduct.brand}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <p className="text-gray-900">{currentProduct.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MRP
                  </label>
                  <p className="text-gray-900">₹{currentProduct.mrp}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price
                  </label>
                  <p className="text-gray-900">₹{currentProduct.selling_price}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HSN Code
                  </label>
                  <p className="text-gray-900">{currentProduct.hsn_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Rate
                  </label>
                  <p className="text-gray-900">{currentProduct.gst_rate}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Group
                  </label>
                  <p className="text-gray-900">{currentProduct.stock_group}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit of Measure
                  </label>
                  <p className="text-gray-900">{currentProduct.unit_of_measure}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintain Batches
                  </label>
                  <p className="text-gray-900">{currentProduct.maintain_batches}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <p className="text-gray-900">{currentProduct.stock_quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Supply
                  </label>
                  <p className="text-gray-900">{currentProduct.type_of_supply}</p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Brand Modal */}
        {showBrandModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-4">Add New Brand</h3>
              <form onSubmit={handleCreateBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBrandModal(false);
                      setNewBrand("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Create Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-4">Add New Category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setNewCategory("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create UOM Modal */}
        {showUOMModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-[#003366] mb-4">Add New Unit of Measure</h3>
              <form onSubmit={handleCreateUOM} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Name
                  </label>
                  <input
                    type="text"
                    value={newUOM}
                    onChange={(e) => setNewUOM(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#003366] focus:ring-[#003366] transition-colors"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUOMModal(false);
                      setNewUOM("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#002244] rounded-lg transition-colors"
                  >
                    Create Unit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}