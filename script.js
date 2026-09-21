// جلب العناصر من صفحة HTML
const totalCostEl = document.getElementById('totalCost');
const subscriptionsListEl = document.getElementById('subscriptionsList');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const subModal = document.getElementById('subModal');
const subForm = document.getElementById('subForm');
const currencySelect = document.getElementById('currencySelect');
const currencySymbolElements = document.querySelectorAll('.currencySymbol');

// تحميل العملة المحفوظة أو استخدام $ كافتراضي
let selectedCurrency = localStorage.getItem('subtrack_currency') || '$';
if (currencySelect) {
    currencySelect.value = selectedCurrency;
}
// تغيير العملة وحفظها
if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
        selectedCurrency = e.target.value;
        localStorage.setItem('subtrack_currency', selectedCurrency);
        saveAndRender();
    });
}


// مصفوفة لتخزين الاشتراكات (يتم تحميلها من التخزين المحلي بالجوال)
let subscriptions = JSON.parse(localStorage.getItem('subtrack_subscriptions')) || [];

// --- 1. إدارة النافذة المنبثقة (Modal) ---
openModalBtn.addEventListener('click', () => {
    subModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    subModal.style.display = 'none';
});

// إغلاق النافذة عند النقر خارجها
window.addEventListener('click', (e) => {
    if (e.target === subModal) {
        subModal.style.display = 'none';
    }
});

// --- 2. إضافة اشتراك جديد ---
subForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('subName').value;
    const cost = parseFloat(document.getElementById('subCost').value);
    const date = document.getElementById('subDate').value;
    const alertDays = parseInt(document.getElementById('subAlertDays').value); // جلب عدد أيام التنبيه

    // داخل حدث subForm.addEventListener('submit', ...)
const isTrial = document.getElementById('isTrial').checked;

const newSubscription = {
    id: Date.now(),
    name,
    cost,
    date,
    alertDays,
    isTrial // حفظ ما إذا كانت تجربة مجانية

    };

    subscriptions.push(newSubscription);
    saveAndRender();

    // إعادة ضبط النموذج وإغلاق النافذة
    subForm.reset();
    subModal.style.display = 'none';
});


// --- 3. حذف اشتراك مع تأكيد (Confirmation Message) ---
function deleteSubscription(id) {
    // البحث عن الاشتراك لمعرفة اسمه لعرضه في الرسالة
    const subToDelete = subscriptions.find(sub => sub.id === id);
    
    if (!subToDelete) return;

    // إظهار رسالة تأكيد للمستخدم
    const confirmDelete = confirm(`هل أنت تأكد من إزالة اشتراك "${subToDelete.name}"؟`);

    // إذا ضغط المستخدم على "موافق" (OK)، يتم الحذف
    if (confirmDelete) {
        subscriptions = subscriptions.filter(sub => sub.id !== id);
        saveAndRender();
    }
}


// --- 4. حفظ البيانات وتحديث الشاشة ---
function saveAndRender() {
    // حفظ في LocalStorage على الهاتف
    localStorage.setItem('subtrack_subscriptions', JSON.stringify(subscriptions));
    
    // إعادة رسم الواجهة وحساب التكاليف
    renderSubscriptions();
    calculateTotal();
}

// --- 5. حساب إجمالي الإنفاق الشهري والسنوي ---
function calculateTotal() {
    // جلب عناصر العرض
    const yearlyCostEl = document.getElementById('yearlyCost');

    // حساب المجموع الشهري
    const monthlyTotal = subscriptions.reduce((sum, sub) => sum + sub.cost, 0);
    
    // حساب المجموع السنوي (الشهري × 12)
    const yearlyTotal = monthlyTotal * 12;

    // تحديث الأرقام على الشاشة
    if (totalCostEl) totalCostEl.textContent = monthlyTotal.toFixed(2);
    if (yearlyCostEl) yearlyCostEl.textContent = yearlyTotal.toFixed(2);
    
    // تحديث رمز العملة في جميع الأماكن
    document.querySelectorAll('.currencySymbol').forEach(el => {
        el.textContent = selectedCurrency;
    });
}


// --- 6. عرض قائمة الاشتراكات مع حساب مدة التنبيه المخصصة والعملة ---
// --- 6. عرض قائمة الاشتراكات مع حساب مدة التنبيه والتجربة المجانية والعملة ---
function renderSubscriptions() {
    subscriptionsListEl.innerHTML = '';

    if (subscriptions.length === 0) {
        subscriptionsListEl.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 20px;">
                لا توجد اشتراكات مضافة بعد.<br>إضغط على الزر أعلاه لإضافة أول اشتراك!
            </div>
        `;
        return;
    }

    subscriptions.forEach(sub => {
        const item = document.createElement('div');
        item.className = 'sub-item';

        const daysLeft = getDaysLeft(sub.date);
        const userAlertDays = sub.alertDays || 2; 

        let statusColor = 'var(--text-muted)';
        let statusText = `تجديد بعد ${daysLeft} يوم`;

        if (daysLeft <= userAlertDays && daysLeft >= 0) {
            statusColor = 'var(--danger)';
            if (daysLeft === 0) {
                statusText = '🔔 التجديد اليوم!';
            } else {
                statusText = `🔔 تنبيه: باقي ${daysLeft} يوم على التجديد`;
            }
        } else if (daysLeft < 0) {
            statusText = 'انتهى موعد التجديد';
        }

        // إعداد وسم التجربة المجانية
        const trialBadge = sub.isTrial 
            ? `<span style="background: #f59e0b; color: #000; font-size: 0.7rem; font-weight: bold; padding: 2px 6px; border-radius: 6px; margin-right: 6px;">تجربة مجانية 🎁</span>` 
            : '';

        item.innerHTML = `
            <div class="sub-info">
                <h3>${sub.name} ${trialBadge}</h3>
                <p style="color: ${statusColor}; font-weight: 500;">${statusText} (${sub.date})</p>
            </div>
            <div class="sub-price" style="display: flex; align-items: center; gap: 12px;">
                <span class="price-amount">${selectedCurrency}${sub.cost.toFixed(2)}</span>
                <button onclick="deleteSubscription(${sub.id})" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1.1rem;">🗑️</button>
            </div>
        `;

        subscriptionsListEl.appendChild(item);
    });
}




// دالة مساعدة لحساب الأيام المتبقية
function getDaysLeft(targetDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(targetDateStr);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// تشغيل العرض الأول عند فتح التطبيق
renderSubscriptions();
calculateTotal();

// --- 7. النسخ الاحتياطي واستعادة البيانات (طريقة Blob السريعة الخالية من التعليق) ---
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// تصدير البيانات إلى ملف JSON دون تعليق التطبيق
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (!subscriptions || subscriptions.length === 0) {
            alert('لا توجد بيانات اشتراكات لتصديرها!');
            return;
        }

        try {
            const dataStr = JSON.stringify(subscriptions, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = url;
            downloadAnchor.download = `subtrack_backup_${Date.now()}.json`;
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();

            // تنظيف الرابط من الذاكرة
            setTimeout(() => {
                document.body.removeChild(downloadAnchor);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            alert('حدث خطأ أثناء التصدير، يرجى المحاولة لاحقاً.');
        }
    });
}

// فتح نافذة اختيار الملف عند الضغط على استعادة
if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
        importFile.value = ''; // إعادة تعيين الحقل لتسهيل اختيار نفس الملف مجدداً
        importFile.click();
    });

    // قراءة الملف المستورد واستعادة الاشتراكات
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    subscriptions = importedData;
                    saveAndRender();
                    alert('تمت استعادة جميع البيانات بنجاح! 🎉');
                } else {
                    alert('تنسيق الملف غير صحيح.');
                }
            } catch (err) {
                alert('حدث خطأ أثناء قراءة الملف، التأكد من صحة ملف JSON.');
            }
        };
        reader.readAsText(file);
    });
}

