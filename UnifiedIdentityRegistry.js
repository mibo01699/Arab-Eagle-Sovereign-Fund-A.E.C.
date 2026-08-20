const scopes = ['username', 'payments', 'wallet_address'];

function authPiUser() {
  Pi.authenticate(scopes, onIncompletePaymentFound)
    .then(function(auth) {
      console.log(`مرحباً بمستخدم الصندوق السيادي: ${auth.user.username}`);
      // أرسل الـ auth.token إلى خادمك الخلفي (app.js) للتحقق منه عبر Pi API
    })
    .catch(function(error) {
      console.error("فشل تسجيل الدخول عبر شبكة Pi:", error);
    });
}

function onIncompletePaymentFound(payment) {
  // دالة حيوية جداً لشروط Pi المحدثة: التعامل مع الدفعات المعلقة أو غير المكتملة
  console.log("تم العثور على دفعة غير مكتملة، يجب تسويتها:", payment);
}
