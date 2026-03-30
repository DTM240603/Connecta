import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, AtSign, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../../services/authService";
import { setToken } from "../../utils/token";

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await registerApi(formData);
      setToken(res.data.token);
      navigate("/");
    } catch (error) {
      alert(error?.response?.data?.message || "Dang ky that bai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card max-w-xl"
      >
        <div className="mb-8">
          <div className="mb-3 inline-flex rounded-full border border-white/80 bg-white/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Connecta
          </div>
          <h1>Tạo tài khoản</h1>
          {/* <p className="text-sm leading-6 text-muted">
            Tham gia ban do ket noi moi voi feed, profile va nhan tin thoi gian
            thuc trong mot giao dien hien dai hon.
          </p> */}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-foreground">
              Họ và tên
            </span>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                className="input pl-11"
                type="text"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Tài khoản
            </span>
            <div className="relative">
              <AtSign
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                className="input pl-11"
                type="text"
                name="username"
                placeholder="connecta_user"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Email</span>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                className="input pl-11"
                type="email"
                name="email"
                placeholder="abc@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-foreground">
              Mật khẩu
            </span>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                className="input pl-11"
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </label>

          <button
            className="btn btn-primary mt-2 w-full justify-center gap-2 py-3 text-base md:col-span-2"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? "Đang đăng ký..." : "Tạo tài khoản"}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 rounded-[24px] border border-white/70 bg-white/45 p-4 text-sm text-muted">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-strong"
          >
            Đặng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
