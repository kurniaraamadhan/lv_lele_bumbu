// src/app/page.js
import styles from './page.module.css'; // Import CSS Module kita

// URL dasar untuk backend kita
// Pastikan ini sesuai dengan port backend Anda (default 5000)
const API_BASE_URL = 'http://localhost:5000';

// Fungsi untuk mengambil data informasi penjual dari backend
async function getSellerInfo() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/seller-info`, {
      cache: 'no-store' // Penting: Ini memastikan data selalu terbaru, tidak di-cache oleh Next.js
    });
    if (!res.ok) {
      // Jika respons bukan OK (misal: 404, 500), lempar error
      throw new Error(`Gagal mengambil informasi penjual: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching seller info:", error);
    // Kembalikan data default jika gagal (opsional, tapi baik untuk robustness)
    return {
      name: "Informasi Penjual Tidak Tersedia",
      whatsapp: "6281234567890",
      address: "Alamat tidak tersedia",
      locationLink: "#",
      operationalHours: "Jam operasional tidak tersedia",
      minOrder: "Ketentuan order tidak tersedia",
    };
  }
}

// Fungsi untuk mengambil data produk ikan dari backend
async function getFishProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/fish-products`, {
      cache: 'no-store' // Penting: Ini memastikan data selalu terbaru, tidak di-cache oleh Next.js
    });
    if (!res.ok) {
      // Jika respons bukan OK, lempar error
      throw new Error(`Gagal mengambil data produk ikan: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching fish products:", error);
    // Kembalikan array kosong jika gagal (opsional)
    return [];
  }
}

// Komponen Home sekarang menjadi async function karena melakukan fetching data
export default async function Home() {
  const sellerInfo = await getSellerInfo();
  const fishProducts = await getFishProducts();

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Pemesanan Ikan Konsumsi & Bibit Ikan</h1>

      {/* Informasi Penjual di Bagian Atas */}
      <div className={styles.sellerInfoBox}>
        <h2 className={styles.sellerTitle}>Informasi Penjual</h2>
        <p className={styles.productDetail}>Nama : {sellerInfo.name}</p>
        <p className={styles.productDetail}>
          Kontak WhatsApp :{' '}
          <a
            href={`https://wa.me/${sellerInfo.whatsapp}?text=Halo%20saya%20tertarik%20dengan%20produk%20ikan%20Anda.`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappLink}
          >
            {sellerInfo.whatsapp} (Klik untuk chat)
          </a>
        </p>
        <p className={styles.productDetail}>
          Alamat : {sellerInfo.address}{' '}
          <a
            href={sellerInfo.locationLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.locationLink}
          >
            (Lihat di Peta)
          </a>
        </p>
        <p className={styles.productDetail}>Jam Operasional : {sellerInfo.operationalHours}</p>
        <p className={styles.productDetail}>Ketentuan Order : {sellerInfo.minOrder}</p>
      </div>

      <div>
        <h2 className={`${styles.sectionTitle} ${styles.availableTitle}`}>Ikan Tersedia</h2>
        <div className={styles.productsGrid}>
          {fishProducts
            .filter(fish => fish.isAvailable)
            .map(fish => (
              <div key={fish.id} className={styles.productCard}>
                {fish.imageUrl && (
                  <img src={`${API_BASE_URL}${fish.imageUrl}`} alt={fish.name} className={styles.productImage} />
                )}
                <h3 className={styles.productName}>{fish.name}</h3>
                <p className={styles.productDetail}>Jenis : {fish.type}</p>
                {/* PERBAIKAN DI SINI */}
                {(fish.type === "Bibit" || fish.type === "Indukan") && (
                  <p className={styles.productDetail}>Ukuran : {fish.size}</p>
                )}
                <p className={styles.stockAvailable}>Stok: {fish.stock} {fish.unit}</p>
                <p className={styles.price}>Harga : Rp. {fish.price.toLocaleString('id-ID')} / {fish.unit}</p>
                <a
                  href={`https://wa.me/${sellerInfo.whatsapp}?text=Halo%2C%20saya%20tertarik%20dengan%20${encodeURIComponent(fish.name)}%20(ID%3A%20${fish.id}).%20Apakah%20stoknya%20masih%20ada%3F`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappButton}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" alt="WhatsApp Icon" className={styles.whatsappIcon} />
                  Pesan via WhatsApp
                </a>
              </div>
            ))}
        </div>
      </div>

      <hr className={styles.divider} />

      <div>
        <h2 className={`${styles.sectionTitle} ${styles.outOfStockTitle}`}>Ikan Habis (Out of Stock)</h2>
        <div className={styles.productsGrid}>
          {fishProducts
            .filter(fish => !fish.isAvailable)
            .map(fish => (
              <div key={fish.id} className={`${styles.productCard} ${styles.outOfStock}`}>
                {fish.imageUrl && (
                  <img src={`${API_BASE_URL}${fish.imageUrl}`} alt={fish.name} className={styles.productImage} />
                )}
                <h3 className={styles.productName}>{fish.name}</h3>
                <p className={styles.productDetail}>Jenis :  {fish.type}</p>
                {/* PERBAIKAN DI SINI */}
                {(fish.type === "Bibit" || fish.type === "Indukan") && (
                  <p className={styles.productDetail}>Ukuran : {fish.size}</p>
                )}
                <p className={styles.stockOutOfStock}>Status: Stok Habis</p>
                <p className={styles.price}>Harga : Rp{fish.price.toLocaleString('id-ID')} / {fish.unit}</p>
                <button disabled className={styles.disabledButton}>Stok Habis</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}