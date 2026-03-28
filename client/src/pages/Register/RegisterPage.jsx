import { useState } from "react";
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
      alert(error?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng ký Connecta</h1>

        <form onSubmit={handleSubmit} className="form">
          <input
            className="input"
            type="text"
            name="fullName"
            placeholder="Họ và tên"
            value={formData.fullName}
            onChange={handleChange}
          />

          <input
            className="input"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />

          <input
            className="input"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            className="input"
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={handleChange}
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="auth-text">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
