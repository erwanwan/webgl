import "./index.less";
import closeIcon from "../../images/close.png";

const PunchCard = ({close}) => {
  return (
    <div className="punch-card-wrap">
      <div className="punch-card-title-wrap">
        <div className="punch-card-title">门禁系统记录</div>
        <img src={closeIcon} onClick={close} />
      </div>
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>时间</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>456</td>
            <td>2021.9.12 12：10</td>
            <td>通过</td>
          </tr>
          <tr>
            <td>457</td>
            <td>2021.9.12 12：20</td>
            <td>通过</td>
          </tr>
          <tr>
            <td>457</td>
            <td>2021.9.12 13：20</td>
            <td>未通过</td>
          </tr>
        </tbody>
      </table>

    </div>
  )
}

export default PunchCard