const AWS = require('aws-sdk');
const sharp = require('sharp'); // 이미지 리사이즈 라이브러리

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; // s3(버켓) 명
  const Key = decodeURIComponent(event.Records[0].s3.object.key); // original/12312312_abc.png , decodeURIComponent 한글
  console.log(Bucket, Key);
  const filename = Key.split('/')[Key.split('/').length - 1];
  const ext = Key.split('.')[Key.split('.').length - 1].toLowerCase();  // 확장자 소문자로고정
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;
  console.log('filename', filename, 'ext', ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise(); // 버켓에 있는 데이터 가져오기
    console.log('original', s3Object.Body.length);
    const resizedImage = await sharp(s3Object.Body)
      .resize(400, 400, { fit: 'inside' })
      .toFormat(requiredFormat)
      .toBuffer();
    await s3.putObject({  // 다시버켓에 업로드
      Bucket,
      Key: `thumb/${filename}`,
      Body: resizedImage,
    }).promise();
    console.log('put', resizedImage.length);
    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error)
    return callback(error);
  }
}