// src/app/admin/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const API_BASE_URL = 'http://localhost:5000';

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [sellerInfo, setSellerInfo] = useState({
    name: '', whatsapp: '', address: '', locationLink: '', operationalHours: '', minOrder: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const [newProduct, setNewProduct] = useState({
    name: '', type: 'Konsumsi', price: 0, unit: 'kg', isAvailable: true, stock: 0, size: '', imageUrl: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);

  // State untuk file gambar yang dipilih di form
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);


  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const productsRes = await fetch(`${API_BASE_URL}/api/fish-products`, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const sellerInfoRes = await fetch(`${API_BASE_URL}/api/seller-info`, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!productsRes.ok) {
        // Cek status khusus untuk token expired
        if (productsRes.status === 401 || productsRes.status === 403) {
            throw new Error('401/403: Sesi Anda telah berakhir atau tidak valid.');
        }
        throw new Error(`Failed to fetch products: ${productsRes.statusText}`);
      }
      if (!sellerInfoRes.ok) {
         if (sellerInfoRes.status === 401 || sellerInfoRes.status === 403) {
            throw new Error('401/403: Sesi Anda telah berakhir atau tidak valid.');
        }
        throw new Error(`Failed to fetch seller info: ${sellerInfoRes.statusText}`);
      }

      const productsData = await productsRes.json();
      const sellerInfoData = await sellerInfoRes.json();

      setProducts(productsData);
      setSellerInfo(sellerInfoData);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.message.includes('401') || err.message.includes('403')) {
        alert('Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.');
        localStorage.removeItem('authToken');
        router.push('/login');
      } else {
        setError("Gagal memuat data: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS UNTUK PRODUK ---
  const handleNewProductChange = (e) => {
  const { name, value, type, checked } = e.target;
  let newValue = value; // Default, akan menyimpan nilai string

  // PERBAIKAN DI SINI: Konversi 'price' dan 'stock' menjadi number
  if (name === 'price' || name === 'stock') {
    // Jika nilai kosong, ubah menjadi 0. Jika tidak, konversi ke number.
    // Ini memastikan 'stock' dan 'price' selalu berupa angka.
    newValue = value === '' ? 0 : Number(value);
  }

  setNewProduct(prevState => ({
    ...prevState,
    [name]: type === 'checkbox' ? checked : newValue
  }));
};

  const handleImageFileChange = (e) => {
    setSelectedImageFile(e.target.files[0]); // Ambil file pertama yang dipilih
    setImageUploadError(null); // Reset error
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      setImageUploadError('Pilih file gambar terlebih dahulu.');
      return;
    }
    setImageUploadLoading(true);
    setImageUploadError(null);

    const token = getAuthToken();
    if (!token) { alert('Anda harus login untuk mengupload gambar.'); router.push('/login'); setImageUploadLoading(false); return; }

    const formData = new FormData();
    formData.append('image', selectedImageFile); // 'image' harus sesuai dengan nama field di multer.single()

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Kirim token untuk endpoint upload
        },
        body: formData, // FormData tidak perlu Content-Type manual, browser akan mengaturnya
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Gagal mengupload gambar: ${res.statusText}`);
      }

      setNewProduct(prevState => ({ ...prevState, imageUrl: data.imageUrl }));
      setSelectedImageFile(null); // Reset input file
      alert('Gambar berhasil diupload!');
    } catch (err) {
      console.error("Error uploading image:", err);
      setImageUploadError(err.message || 'Terjadi kesalahan saat upload gambar.');
    } finally {
      setImageUploadLoading(false);
    }
  };


  const handleAddProduct = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) { alert('Anda harus login untuk melakukan ini.'); router.push('/login'); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseInt(newProduct.price),
          stock: parseInt(newProduct.stock),
          size: (newProduct.type === 'Bibit' || newProduct.type === 'Indukan') ? newProduct.size : null,
          // imageUrl sudah diupdate melalui handleUploadImage
        }),
      });
      if (!res.ok) throw new Error(`Failed to add product: ${res.statusText}`);
      await res.json();
      setNewProduct({ name: '', type: 'Konsumsi', price: 0, unit: 'kg', isAvailable: true, stock: 0, size: '', imageUrl: '' });
      fetchData();
    } catch (err) {
      console.error("Error adding product:", err);
      alert('Gagal menambahkan produk: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      const token = getAuthToken();
      if (!token) { alert('Anda harus login untuk melakukan ini.'); router.push('/login'); return; }

      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error(`Failed to delete product: ${res.statusText}`);
        fetchData();
      } catch (err) {
        console.error("Error deleting product:", err);
        alert('Gagal menghapus produk: ' + err.message);
      }
    }
  };

  const handleEditProductClick = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      type: product.type,
      price: product.price,
      unit: product.unit,
      isAvailable: product.isAvailable,
      stock: product.stock,
      size: product.size || '',
      imageUrl: product.imageUrl || ''
    });
    setSelectedImageFile(null); // Reset file input saat edit
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const token = getAuthToken();
    if (!token) { alert('Anda harus login untuk melakukan ini.'); router.push('/login'); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseInt(newProduct.price),
          stock: parseInt(newProduct.stock),
          size: (newProduct.type === 'Bibit' || newProduct.type === 'Indukan') ? newProduct.size : null,
        }),
      });
      if (!res.ok) throw new Error(`Failed to update product: ${res.statusText}`);
      setEditingProduct(null);
      setNewProduct({ name: '', type: 'Konsumsi', price: 0, unit: 'kg', isAvailable: true, stock: 0, size: '', imageUrl: '' });
      fetchData();
    } catch (err) {
      console.error("Error updating product:", err);
      alert('Gagal memperbarui produk: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProduct({ name: '', type: 'Konsumsi', price: 0, unit: 'kg', isAvailable: true, stock: 0, size: '', imageUrl: '' });
    setSelectedImageFile(null); // Reset file input saat cancel
  };

  const handleSellerInfoChange = (e) => {
    const { name, value } = e.target;
    setSellerInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleUpdateSellerInfo = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) { alert('Anda harus login untuk melakukan ini.'); router.push('/login'); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/api/seller-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sellerInfo),
      });
      if (!res.ok) throw new Error(`Failed to update seller info: ${res.statusText}`);
      fetchData();
    } catch (err) {
      console.error("Error updating seller info:", err);
      alert('Gagal memperbarui informasi penjual: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  if (loading) return <p className={styles.loadingText}>Memuat data admin...</p>;
  if (error) return <p className={styles.errorText}>Error: {error}</p>;
  if (!getAuthToken() && !loading) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Admin Panel Pemesanan Ikan</h1>

      <button onClick={handleLogout} className={`${styles.submitButton} ${styles.deleteButton}`} style={{ float: 'right', marginBottom: '20px' }}>
        Logout
      </button>
      <div style={{ clear: 'both' }}></div>

      {/* Bagian Edit Informasi Penjual */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Edit Informasi Penjual</h2>
        <form onSubmit={handleUpdateSellerInfo}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="sellerName">Nama Penjual:</label>
              <input
                type="text"
                id="sellerName"
                name="name"
                value={sellerInfo.name}
                onChange={handleSellerInfoChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="sellerWhatsapp">WhatsApp (62xxxxxx):</label>
              <input
                type="text"
                id="sellerWhatsapp"
                name="whatsapp"
                value={sellerInfo.whatsapp}
                onChange={handleSellerInfoChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="sellerAddress">Alamat:</label>
              <textarea
                id="sellerAddress"
                name="address"
                value={sellerInfo.address}
                onChange={handleSellerInfoChange}
                required
              ></textarea>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="sellerLocationLink">Link Google Maps:</label>
              <input
                type="text"
                id="sellerLocationLink"
                name="locationLink"
                value={sellerInfo.locationLink}
                onChange={handleSellerInfoChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="sellerOperationalHours">Jam Operasional:</label>
              <input
                type="text"
                id="sellerOperationalHours"
                name="operationalHours"
                value={sellerInfo.operationalHours}
                onChange={handleSellerInfoChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="sellerMinOrder">Ketentuan Order:</label>
              <textarea
                id="sellerMinOrder"
                name="minOrder"
                value={sellerInfo.minOrder}
                onChange={handleSellerInfoChange}
              ></textarea>
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>Update Informasi Penjual</button>
        </form>
      </div>

      {/* Bagian Tambah/Edit Produk */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
        <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="productName">Nama Ikan:</label>
              <input
                type="text"
                id="productName"
                name="name"
                value={newProduct.name}
                onChange={handleNewProductChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="productType">Jenis:</label>
              <select
                id="productType"
                name="type"
                value={newProduct.type}
                onChange={handleNewProductChange}
                required
              >
                <option value="Konsumsi">Konsumsi</option>
                <option value="Indukan">Indukan</option>
                <option value="Bibit">Bibit</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="productPrice">Harga:</label>
              <input
                type="number"
                id="productPrice"
                name="price"
                value={newProduct.price}
                onChange={handleNewProductChange}
                required
                min="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="productUnit">Satuan:</label>
              <input
                type="text"
                id="productUnit"
                name="unit"
                value={newProduct.unit}
                onChange={handleNewProductChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="productStock">Stok:</label>
              <input
                type="number"
                id="productStock"
                name="stock"
                value={newProduct.stock}
                onChange={handleNewProductChange}
                required
                min="0"
              />
            </div>
            {newProduct.type === 'Indukan' && (
              <div className={styles.formGroup}>
                <label htmlFor="productSize">Ukuran Indukan:</label>
                <input
                  type="text"
                  id="productSize"
                  name="size"
                  value={newProduct.size}
                  onChange={handleNewProductChange}
                />
              </div>
            )}
            {newProduct.type === 'Bibit' && (
              <div className={styles.formGroup}>
                <label htmlFor="productSize">Ukuran Bibit:</label>
                <input
                  type="text"
                  id="productSize"
                  name="size"
                  value={newProduct.size}
                  onChange={handleNewProductChange}
                />
              </div>
            )}
            {/* Input Gambar */}
            <div className={styles.formGroup}>
              <label htmlFor="productImageFile">Upload Gambar:</label>
              <input
                type="file"
                id="productImageFile"
                name="image" // Nama field ini harus 'image' sesuai multer
                accept="image/*"
                onChange={handleImageFileChange}
              />
              <button
                type="button"
                onClick={handleUploadImage}
                disabled={!selectedImageFile || imageUploadLoading}
                className={styles.actionButton}
                style={{ marginTop: '10px', backgroundColor: imageUploadLoading ? '#ccc' : '#28a745' }}
              >
                {imageUploadLoading ? 'Mengupload...' : 'Upload Gambar'}
              </button>
              {imageUploadError && <p className={styles.errorMessage}>{imageUploadError}</p>}
              {newProduct.imageUrl && (
                <div style={{ marginTop: '10px' }}>
                  <p>Gambar Terpilih:</p>
                  <img src={`${API_BASE_URL}${newProduct.imageUrl}`} alt="Preview" className={styles.productImage} style={{ width: '100px', height: 'auto' }} />
                  <p style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>URL: {newProduct.imageUrl}</p>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={newProduct.isAvailable}
                  onChange={handleNewProductChange}
                />
                <label htmlFor="isAvailable">Tersedia?</label>
              </div>
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>
            {editingProduct ? 'Perbarui Produk' : 'Tambah Produk'}
          </button>
          {editingProduct && (
            <button type="button" onClick={handleCancelEdit} className={`${styles.submitButton} ${styles.deleteButton}`} style={{ marginLeft: '10px' }}>
              Batal Edit
            </button>
          )}
        </form>
      </div>

      {/* Bagian Daftar Produk */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Daftar Semua Produk</h2>
        <table className={styles.productsTable}>
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Nama</th>
              <th>Jenis</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Ukuran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td data-label="Gambar">
                    {/* Menggunakan API_BASE_URL karena gambar di server backend */}
                    {product.imageUrl && (
                        <img src={`${API_BASE_URL}${product.imageUrl}`} alt={product.name} className={styles.productImage} />
                    )}
                </td>
                <td data-label="Nama">{product.name}</td>
                <td data-label="Jenis">{product.type}</td>
                <td data-label="Harga">Rp{product.price.toLocaleString('id-ID')} / {product.unit}</td>
                <td data-label="Stok">{product.stock} {product.unit}</td>
                <td data-label="Ukuran">{product.size || '-'}</td>
                <td data-label="Status">
                  <span className={`${styles.statusText} ${product.isAvailable ? styles.statusAvailable : styles.statusOutOfStock}`}>
                    {product.isAvailable ? 'Ready' : 'Habis'}
                  </span>
                </td>
                <td data-label="Aksi">
                  <button onClick={() => handleEditProductClick(product)} className={styles.actionButton}>Edit</button>
                  <button onClick={() => handleDeleteProduct(product.id)} className={`${styles.actionButton} ${styles.deleteButton}`}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}