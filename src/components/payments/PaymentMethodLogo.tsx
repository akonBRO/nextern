import Image from 'next/image';

export type PaymentMethodId = 'bkash' | 'visa' | 'mastercard';

const PAYMENT_METHOD_LOGOS: Record<
  PaymentMethodId,
  { alt: string; height: number; src: string; width: number }
> = {
  bkash: {
    alt: 'bKash',
    height: 320,
    src: '/bkash-logo.png',
    width: 320,
  },
  visa: {
    alt: 'Visa',
    height: 2000,
    src: '/Visa_logo.png',
    width: 3000,
  },
  mastercard: {
    alt: 'Mastercard',
    height: 257,
    src: '/Mastercard-logo.png',
    width: 330,
  },
};

type PaymentMethodLogoProps = {
  method: PaymentMethodId;
  height?: number;
};

export function PaymentMethodLogo({ method, height = 28 }: PaymentMethodLogoProps) {
  const logo = PAYMENT_METHOD_LOGOS[method];

  return (
    <span
      style={{
        alignItems: 'center',
        display: 'inline-flex',
        height,
        justifyContent: 'center',
        width: Math.max(42, Math.round(height * 1.8)),
      }}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        sizes={`${Math.max(42, Math.round(height * 1.8))}px`}
        style={{
          display: 'block',
          height: '100%',
          objectFit: 'contain',
          width: '100%',
        }}
      />
    </span>
  );
}
