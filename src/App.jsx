import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [shops, setShops] = useState([]);
  const [name, setName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [selectedCatsForAdd, setSelectedCatsForAdd] = useState([]);
  const [selectedTimesForAdd, setSelectedTimesForAdd] = useState([]);

  const [result, setResult] = useState(null);
  const [isTimeChecked, setIsTimeChecked] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [filterCats, setFilterCats] = useState([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [pickedShop, setPickedShop] = useState(null);

  const API_URL = "https://foodrandom.onrender.com/shops";
  const TIME_OPTIONS = ["เช้า", "กลางวัน", "เย็น", "ดึก"];

  const fetchShops = async () => {
    try {
      const res = await axios.get(API_URL);
      setShops(res.data);
      const allCats = [...new Set(res.data.flatMap((shop) => shop.categories))];
      if (filterCats.length === 0) {
        setFilterCats(allCats);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    }
  };

  useEffect(() => {
    fetchShops();

    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes().toString().padStart(2, "0");

      let period = "ดึก";
      if (hour >= 6 && hour < 11) period = "เช้า";
      else if (hour >= 11 && hour < 15) period = "กลางวัน";
      else if (hour >= 15 && hour < 22) period = "เย็น";

      setCurrentTimeStr(`${hour}:${min}`);
      setCurrentPeriod(period);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleArrayItem = (value, array, setter) => {
    if (array.includes(value)) {
      setter(array.filter((item) => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const addShop = async () => {
    if (!name.trim()) return;

    let finalCats = [...selectedCatsForAdd];
    if (newCat.trim()) finalCats.push(newCat.trim());
    if (finalCats.length === 0) finalCats = ["ทั่วไป"];

    try {
      await axios.post(API_URL, {
        name: name.trim(),
        categories: finalCats,
        times: selectedTimesForAdd.length > 0 ? selectedTimesForAdd : TIME_OPTIONS,
      });

      setName("");
      setNewCat("");
      setSelectedCatsForAdd([]);
      setSelectedTimesForAdd([]);
      setShowAddForm(false);
      fetchShops();
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = (shop) => {
    setShopToDelete(shop);
    setShowDeleteModal(true);
  };

  const deleteShop = async () => {
    if (!shopToDelete) return;
    try {
      await axios.delete(`${API_URL}/${shopToDelete._id}`);
      setShowDeleteModal(false);
      setShopToDelete(null);
      fetchShops();
    } catch (error) {
      console.error(error);
    }
  };

  const randomShop = () => {
    let validShops = shops.filter((shop) =>
      shop.categories.some((cat) => filterCats.includes(cat))
    );

    if (isTimeChecked) {
      validShops = validShops.filter((shop) =>
        shop.times.includes(currentPeriod)
      );
    }

    if (validShops.length === 0) {
      setResult("ไม่พบร้านที่ตรงเงื่อนไข");
      return;
    }

    let count = 0;
    const animation = setInterval(() => {
      const random = validShops[Math.floor(Math.random() * validShops.length)];
      setResult(random.name);
      count++;
      if (count > 12) {
        clearInterval(animation);
        const finalPick = validShops[Math.floor(Math.random() * validShops.length)];
        setResult(finalPick.name);
        setPickedShop(finalPick);
        setShowResultModal(true);
      }
    }, 80);
  };

  const existingCats = [...new Set(shops.flatMap((shop) => shop.categories))];

  return (
    <div className="container">

      {/* header */}
      <div className="header">
        <h2>🍜 วันนี้กินอะไรดี?</h2>
        <span className="time-status">
          {currentTimeStr} น. · {currentPeriod}
        </span>
      </div>

      {/* hero: สุ่มร้าน */}
      <div className="hero-random">
        <div className={`result-box ${!result ? "placeholder" : ""}`}>
          {result ?? "กดสุ่มเพื่อเลือกร้าน"}
        </div>
        <button className="btn-random" onClick={randomShop}>
          🎲 สุ่มร้านอาหาร
        </button>
      </div>

      {/* ตัวกรอง */}
      <div className="section">
        <span className="section-title">ตัวกรองการสุ่ม</span>
        <div className="section-body">
          <p className="label-text">หมวดหมู่</p>
          <div className="checkbox-group">
            
            {/* 🌟 เพิ่มปุ่ม เลือกทั้งหมด ตรงนี้ 🌟 */}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filterCats.length === existingCats.length && existingCats.length > 0}
                onChange={() => {
                  if (filterCats.length === existingCats.length) {
                    setFilterCats([]);
                  } else {
                    setFilterCats(existingCats);
                  }
                }}
              />
              เลือกทั้งหมด
            </label>

            {existingCats.map((cat) => (
              <label key={cat} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filterCats.includes(cat)}
                  onChange={() => toggleArrayItem(cat, filterCats, setFilterCats)}
                />
                {cat}
              </label>
            ))}
          </div>
          <label className="time-filter">
            <input
              type="checkbox"
              checked={isTimeChecked}
              onChange={(e) => setIsTimeChecked(e.target.checked)}
            />
            สุ่มเฉพาะร้านที่เปิดตอนนี้ ({currentPeriod})
          </label>
        </div>
      </div>

      {/* เพิ่มร้าน */}
      <div className="section">
        <div
          className="section-header"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <span className="section-title">+ เพิ่มร้านอาหาร</span>
          <span className={`toggle-icon ${showAddForm ? "open" : ""}`}>▾</span>
        </div>

        {showAddForm && (
          <div className="section-body">
            <input
              type="text"
              placeholder="ชื่อร้านอาหาร"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <p className="label-text">หมวดหมู่</p>
            <div className="checkbox-group">
              {existingCats.map((cat) => (
                <label key={cat} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCatsForAdd.includes(cat)}
                    onChange={() =>
                      toggleArrayItem(cat, selectedCatsForAdd, setSelectedCatsForAdd)
                    }
                  />
                  {cat}
                </label>
              ))}
              <input
                type="text"
                placeholder="+ หมวดใหม่"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="small-input"
              />
            </div>

            <p className="label-text">เวลาเปิดบริการ</p>
            <div className="checkbox-group">
              {TIME_OPTIONS.map((time) => (
                <label key={time} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTimesForAdd.includes(time)}
                    onChange={() =>
                      toggleArrayItem(time, selectedTimesForAdd, setSelectedTimesForAdd)
                    }
                  />
                  {time}
                </label>
              ))}
            </div>

            <button className="btn-add" onClick={addShop}>
              บันทึกร้าน
            </button>
          </div>
        )}
      </div>

      {/* รายชื่อร้าน */}
      <div className="shop-list-section">
        <span className="section-title" style={{display:"block", marginBottom:"4px"}}>ร้านอาหารทั้งหมด</span>

        {shops.length === 0 ? (
          <p className="empty-state">ยังไม่มีร้านอาหาร กดเพิ่มร้านด้านบนได้เลย</p>
        ) : (
          <ul>
            {shops.map((shop) => (
              <li key={shop._id}>
                <div className="shop-info">
                  <span className="shop-name">{shop.name}</span>
                  <div className="badges">
                    {shop.categories.map((cat) => (
                      <span key={cat} className="badge">{cat}</span>
                    ))}
                    {shop.times.map((time) => (
                      <span key={time} className="badge badge-time">{time}</span>
                    ))}
                  </div>
                </div>
                <button className="btn-delete" onClick={() => confirmDelete(shop)}>
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* modal ผลสุ่ม */}
      {showResultModal && pickedShop && (
        <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
          <div className="modal-result" onClick={(e) => e.stopPropagation()}>
            <div className="modal-result-emoji">🎉</div>
            <p className="modal-result-label">วันนี้กินที่</p>
            <h2 className="modal-result-name">{pickedShop.name}</h2>
            <button className="btn-result-close" onClick={() => setShowResultModal(false)}>
              ตกลง!
            </button>
          </div>
        </div>
      )}

      {/* modal ยืนยันลบ */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>ยืนยันการลบ</h3>
            <p>
              ต้องการลบร้าน <b>{shopToDelete?.name}</b> หรือไม่?
            </p>
            <div className="modal-buttons">
              <button className="btn-confirm" onClick={deleteShop}>
                ลบข้อมูล
              </button>
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;