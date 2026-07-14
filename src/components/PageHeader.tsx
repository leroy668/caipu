import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  back?: boolean;
  actions?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  back = false,
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <div className="page-title-row">
        {back && (
          <button className="back-button" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
            返回主页
          </button>
        )}
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
