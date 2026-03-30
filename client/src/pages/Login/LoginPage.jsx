import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../../services/authService";
import { setToken } from "../../utils/token";

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
      const res = await loginApi(formData);
      setToken(res.data.token);
      navigate("/");
    } catch (error) {
      alert(error?.response?.data?.message || "Dang nhap that bai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="mb-8">
          <div className="mb-3 inline-flex rounded-full border border-white/80 bg-white/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Connecta
          </div>
          <h1>Đăng nhập</h1>
          {/* <p className="text-sm leading-6 text-muted">
            Phien ban giao dien moi huong den cam giac am hon, hien dai hon va
            de demo hon cho do an.
          </p> */}
        </div>

        <form onSubmit={handleSubmit} className="form">
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

          <label className="space-y-2">
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
            className="btn btn-primary mt-2 w-full justify-center gap-2 py-3 text-base"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 rounded-[24px] border border-white/70 bg-white/45 p-4 text-sm text-muted">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary-strong"
          >
            Đăng ký ngay
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
