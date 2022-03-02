import "./index.less";
import closeIcon from "../../images/close.png";

const Alarm = ({close}) => {
  return (
    <div className="punch-card-wrap">
      <div className="punch-card-title-wrap">
        <div className="punch-card-title">告警</div>
        <img src={closeIcon} onClick={close} />
      </div>
      <div>
        这个服务器有问题！！！
      </div>
      

    </div>
  )
}

export default Alarm