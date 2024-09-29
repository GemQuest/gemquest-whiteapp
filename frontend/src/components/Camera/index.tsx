import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from "../../lib/ThemeContext";

const Camera = ({ topic }: { topic: string }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeReaderRef = useRef<HTMLDivElement | null>(null);
  const { setTheme, setNftToBurn, setTicketToActivate } = useTheme();

  const onScanSuccess = (decodedText: string) => {
    if (topic === "quizz") {
      setTheme(decodedText);
    } else if (topic === "burnUserNFT") {
      setNftToBurn(decodedText);
    } else if (topic === "activateTicket") {
      setTicketToActivate(decodedText);
    }
  };

  const onScanFailure = (errorMessage: string) => {
    if (
      !errorMessage.includes(
        "No MultiFormat Readers were able to detect the code"
      ) &&
      !errorMessage.includes("Index or size is negative or greater")
    ) {
      console.error(errorMessage);
    }
  };

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-code-reader");
    scannerRef.current = scanner;

    const startScanner = async (facingMode: string) => {
      if (!scannerRef.current) return;

      try {
        await scannerRef.current.start(
          { facingMode },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1.0,
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (error) {
        console.error("Error starting the scanner:", error);
      }
    };

    const getCameraFacingMode = async (): Promise<string> => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return "environment";
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
      );

      return backCamera ? "environment" : "user";
    };

    (async () => {
      const facingMode = await getCameraFacingMode();
      await startScanner(facingMode);
    })();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .catch((err) => console.error("Error stopping the scanner:", err));
        } catch (error) {
          console.error("Error stopping the scanner:", error);
        }
      }
    };
  }, []);

  return (
    <div className="camera-container">
      <div id="qr-code-reader" ref={qrCodeReaderRef} />
    </div>
  );
};

export default Camera;
