import moment from 'moment';
import QRCode from 'qrcode-svg';

var name = document.getElementById('name');
var phoneNum = document.getElementById('phoneNum');
var carNum = document.getElementById('carNum');
var createBtn = document.getElementById('create');

createBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    var now = new Date();
    var regdate = moment(now).format("YYYYMMDD HH:mm:ss");
    //QR 생성
    const qrcode = new QRCode({
        content: JSON.stringify({
            name: name.value,
            phoneNum: phoneNum.value,
            carNum: carNum.value,
            regdate: regdate,
          }),
        container: "svg-viewbox",
        ecl: "H",
        join: true
    });
    var svg = qrcode.svg();
    document.getElementById('qr').innerHTML = svg;
})

