
<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 1. Verify reCAPTCHA
    $recaptchaSecret = '6Ler5TkrAAAAAM15JD_mAvXXgKGMDSIBgfGGan-L';
    $recaptchaResponse = $_POST['g-recaptcha-response'];

    $verify = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=$recaptchaSecret&response=$recaptchaResponse");
    $responseData = json_decode($verify);
    file_put_contents("recaptcha-debug.txt", $verify);

    if (!$responseData->success) {
        echo "<h1>reCAPTCHA verification failed.</h1>";
        echo "<pre>";
        print_r($responseData);
        echo "</pre>";
        exit;
    }

    // 2. Email setup
    $to = "booking@carestheticpr.com";
    $subject = "Nueva consulta desde la web";

    // Sanitize and collect form inputs
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $phone = strip_tags(trim($_POST["phone"]));
    $service = strip_tags(trim($_POST["service"]));
    $message = strip_tags(trim($_POST["message"]));

    // Email body
    $body = "Nombre: $name\n";
    $body .= "Correo Electrónico: $email\n";
    $body .= "Teléfono: $phone\n";
    $body .= "Servicio de Interés: $service\n\n";
    $body .= "Mensaje:\n$message";

    // Headers
    $headers = "From: $name <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";

    // Send email
    if (mail($to, $subject, $body, $headers)) {
        header("Location: gracias.html");
        exit;
    } else {
        echo "Error al enviar el correo.";
    }

} else {
    http_response_code(403);
    echo "reCAPTCHA verification failed. Google says: " . print_r($responseData, true);
}
?>