import { ChefHat, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        setMessage(await signUp(email, password));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">
            <ChefHat size={25} />
          </span>
          <strong>食记</strong>
        </div>
        <div className="auth-heading">
          <span className="eyebrow">你的私人厨房</span>
          <h1>{mode === "login" ? "欢迎回来" : "建立你的菜谱库"}</h1>
          <p>菜谱、收藏夹与采购清单，在所有设备保持同步。</p>
        </div>

        <div className="segmented-control">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            登录
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>邮箱</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </label>
          <label>
            <span>密码</span>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {message && <p className="form-message">{message}</p>}
          <button className="primary-button auth-submit" disabled={submitting}>
            {submitting ? "正在处理..." : mode === "login" ? "进入厨房" : "创建账户"}
          </button>
        </form>
      </section>
      <div className="auth-visual" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=88"
          alt=""
        />
        <div className="auth-quote">
          <p>“记下好味道，也记下每一次为家人下厨。”</p>
        </div>
      </div>
    </main>
  );
}
