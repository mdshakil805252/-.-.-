/**
 * মেসার্স এস. এম. ট্রেডার্স
 * অফলাইন বিজনেস লজিক ও সার্ভিস ওয়ার্কার
 */

const defaultData = {
  shopInfo: {
    name: "মেসার্স এস. এম. ট্রেডার্স",
    address: "বাজার রোড, সদর মোড়, বাংলাদেশ",
    phone: "০১৭১০-০০০০০০",
    tagline: "সকল প্রকার কৃষি বীজ ও কীটনাশক বিক্রয় করা হয়"
  },
  products: [
    { id: 1, name: "হাইব্রিড ভুট্টার বীজ (১ কেজি)", price: 380, stock: 50 },
    { id: 2, name: "হাইব্রিড ধান বীজ (৫ কেজি)", price: 650, stock: 40 },
    { id: 3, name: "দানাদার কীটনাশক (১ কেজি)", price: 240, stock: 60 },
    { id: 4, name: "তরল বালাইনাশক (১০০ মি.লি.)", price: 190, stock: 35 }
  ],
  sales: []
};

let shopInfo = JSON.parse(localStorage.getItem('sm_shop_info')) || defaultData.shopInfo;
let products = JSON.parse(localStorage.getItem('sm_products')) || defaultData.products;
let sales = JSON.parse(localStorage.getItem('sm_sales')) || defaultData.sales;

function saveAll() {
  localStorage.setItem('sm_shop_info', JSON.stringify(shopInfo));
  localStorage.setItem('sm_products', JSON.stringify(products));
  localStorage.setItem('sm_sales', JSON.stringify(sales));
  
  renderShopInfo();
  renderProducts();
  renderDashboard();
  renderHistory();
  renderDues();
  populatePosProducts();
}

function switchTab(tabId, ev) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  const targetContent = document.getElementById(tabId);
  if (targetContent) targetContent.classList.add('active');
  if (ev && ev.target) ev.target.classList.add('active');
}

function renderShopInfo() {
  const shopNameEl = document.getElementById('memo-shop-name');
  const shopAddressEl = document.getElementById('memo-shop-address');
  const shopPhoneEl = document.getElementById('memo-shop-phone');
  
  if (shopNameEl) shopNameEl.innerText = shopInfo.name;
  if (shopAddressEl) shopAddressEl.innerText = "ঠিকানা: " + shopInfo.address;
  if (shopPhoneEl) shopPhoneEl.innerText = "মোবাইল: " + shopInfo.phone;

  if (document.getElementById('set-shop-name')) {
    document.getElementById('set-shop-name').value = shopInfo.name;
    document.getElementById('set-shop-address').value = shopInfo.address;
    document.getElementById('set-shop-phone').value = shopInfo.phone;
  }
}

function saveSettings() {
  shopInfo.name = document.getElementById('set-shop-name').value.trim() || shopInfo.name;
  shopInfo.address = document.getElementById('set-shop-address').value.trim() || shopInfo.address;
  shopInfo.phone = document.getElementById('set-shop-phone').value.trim() || shopInfo.phone;
  
  saveAll();
  alert("দোকানের তথ্য সফলভাবে আপডেট করা হয়েছে!");
}

function addProduct() {
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  const stock = parseInt(document.getElementById('p-stock').value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("পণ্যের নাম, মূল্য এবং সঠিক স্টক পরিমাণ দিন!");
    return;
  }

  products.push({ id: Date.now(), name, price, stock });
  saveAll();

  document.getElementById('p-name').value = '';
  document.getElementById('p-price').value = '';
  document.getElementById('p-stock').value = '';
}

function deleteProduct(id) {
  if (confirm("আপনি কি নিশ্চিতভাবে এই আইটেমটি মুছে ফেলতে চান?")) {
    products = products.filter(p => p.id !== id);
    saveAll();
  }
}

function renderProducts() {
  const tbody = document.getElementById('product-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  products.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>৳ ${p.price.toFixed(2)}</td>
        <td>${p.stock} টি / কেজি / প্যাকেট</td>
        <td>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="deleteProduct(${p.id})">
            মুছুন
          </button>
        </td>
      </tr>
    `;
  });
}

function populatePosProducts() {
  const sel = document.getElementById('pos-product-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- বীজ অথবা কীটনাশক নির্বাচন করুন --</option>';

  products.forEach(p => {
    sel.innerHTML += `<option value="${p.id}">${p.name} (মজুদ: ${p.stock})</option>`;
  });
}

function updatePosPrice() {
  const pid = document.getElementById('pos-product-select').value;
  const prod = products.find(p => p.id == pid);
  if (prod) {
    document.getElementById('pos-price').value = prod.price;
  }
}

function completeSale() {
  const name = document.getElementById('pos-cust-name').value.trim() || "সাধারণ ক্রেতা";
  const phone = document.getElementById('pos-cust-phone').value.trim() || "প্রযোজ্য নয়";
  const pid = document.getElementById('pos-product-select').value;
  const price = parseFloat(document.getElementById('pos-price').value);
  const qty = parseInt(document.getElementById('pos-qty').value);
  const paid = parseFloat(document.getElementById('pos-paid').value) || 0;

  const prod = products.find(p => p.id == pid);
  if (!prod) {
    alert("অনুগ্রহ করে একটি পণ্য নির্বাচন করুন!");
    return;
  }
  if (qty > prod.stock) {
    alert(`পর্যাপ্ত স্টক নেই! বর্তমানে দোকানে মজুদ আছে মাত্র ${prod.stock} টি।`);
    return;
  }

  const total = price * qty;
  const due = total - paid;
  prod.stock -= qty;

  const invNo = Math.floor(1000 + Math.random() * 9000);
  const saleDate = new Date().toLocaleDateString('bn-BD');

  const saleRecord = {
    id: Date.now(),
    invNo,
    date: saleDate,
    customer: name,
    phone: phone,
    product: prod.name,
    price,
    qty,
    total,
    paid,
    due: due > 0 ? due : 0
  };

  sales.unshift(saleRecord);
  saveAll();

  document.getElementById('m-inv-no').innerText = invNo;
  document.getElementById('m-date').innerText = saleDate;
  document.getElementById('m-cust-name').innerText = name;
  document.getElementById('m-cust-phone').innerText = phone;
  document.getElementById('m-prod-name').innerText = prod.name;
  document.getElementById('m-price').innerText = '৳ ' + price;
  document.getElementById('m-qty').innerText = qty;
  document.getElementById('m-total').innerText = '৳ ' + total;
  document.getElementById('m-bill').innerText = total;
  document.getElementById('m-paid').innerText = paid;
  document.getElementById('m-due').innerText = saleRecord.due;

  alert("বিক্রয় সম্পন্ন হয়েছে! মেমো প্রিন্ট বা PDF ডাউনলোড করতে পারেন।");
}

function renderHistory() {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  sales.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.date}</td>
        <td>${s.customer} (${s.phone})</td>
        <td>${s.product} (${s.qty} টি)</td>
        <td>৳ ${s.total}</td>
        <td style="color: green; font-weight: 500;">৳ ${s.paid}</td>
        <td style="color: ${s.due > 0 ? 'red' : 'gray'}; font-weight: bold;">৳ ${s.due}</td>
      </tr>
    `;
  });
}

function renderDues() {
  const tbody = document.getElementById('due-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const dueList = sales.filter(s => s.due > 0);
  dueList.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${s.customer}</strong></td>
        <td>${s.phone}</td>
        <td style="color: red; font-weight: bold;">৳ ${s.due}</td>
        <td>
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="collectDue(${s.id})">
            টাকা জমা নিন
          </button>
        </td>
      </tr>
    `;
  });
}

function collectDue(saleId) {
  const amount = prompt("গ্রাহক থেকে কত টাকা নগদ জমা নেওয়া হলো?");
  if (amount && !isNaN(amount)) {
    const item = sales.find(s => s.id === saleId);
    if (item) {
      const val = parseFloat(amount);
      item.paid += val;
      item.due = Math.max(0, item.due - val);
      saveAll();
    }
  }
}

function renderDashboard() {
  const totalSales = sales.reduce((acc, curr) => acc + curr.total, 0);
  const totalPaid = sales.reduce((acc, curr) => acc + curr.paid, 0);
  const totalDue = sales.reduce((acc, curr) => acc + curr.due, 0);

  if (document.getElementById('dash-total-sales')) document.getElementById('dash-total-sales').innerText = '৳ ' + totalSales;
  if (document.getElementById('dash-cash')) document.getElementById('dash-cash').innerText = '৳ ' + totalPaid;
  if (document.getElementById('dash-due')) document.getElementById('dash-due').innerText = '৳ ' + totalDue;
  if (document.getElementById('dash-products')) document.getElementById('dash-products').innerText = products.length;
}

function exportJSONBackup() {
  const fullBackup = {
    shopInfo,
    products,
    sales,
    backupDate: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `SM_Traders_Backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importJSONBackup(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (importedData.products && importedData.sales) {
        shopInfo = importedData.shopInfo || shopInfo;
        products = importedData.products;
        sales = importedData.sales;
        saveAll();
        alert("ব্যাকআপ ফাইল সফলভাবে রিস্টোর হয়েছে!");
      } else {
        alert("ভুল JSON ফাইল! সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।");
      }
    } catch (err) {
      alert("JSON ফাইল রিড করতে সমস্যা হয়েছে!");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// সার্ভিস ওয়ার্কার রেজিস্টার (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA Service Worker Ready:', reg.scope))
      .catch(err => console.log('Service Worker Error:', err));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  saveAll();
});
