import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CartScreen } from '@/src/components/display/cart-screen';
import { DemoBar } from '@/src/components/display/demo-bar';
import { IdleScreen } from '@/src/components/display/idle-screen';
import { PairedScreen, PairingScreen } from '@/src/components/display/pairing-screen';
import { QrScreen } from '@/src/components/display/qr-screen';
import { ExpiredScreen, PaidScreen } from '@/src/components/display/status-screens';
import { useDisplay } from '@/src/display/display-store';
import { usePairing } from '@/src/pairing/pairing-store';

const KEEP_AWAKE_TAG = 'customer-display';

/**
 * Màn hình phía khách của quầy: một route duy nhất. Chưa ghép thì hiện mã ghép (11.10); đã ghép thì
 * nội dung đổi theo `state.screen` (idle → cart → qr → paid). Không có điều hướng/nút bấm — khách
 * không thao tác được gì.
 */
export default function CustomerDisplay() {
  // mục 11.11: giữ màn hình luôn sáng. Trình duyệt có thể từ chối Wake Lock → bỏ qua, không văng lỗi.
  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);
  const { state } = useDisplay();
  const { state: pairing } = usePairing();

  // key đổi theo màn hình đang hiện để mỗi lần chuyển đều có hiệu ứng mờ dần
  const screenKey =
    pairing.status !== 'paired' ? pairing.status : pairing.justPaired ? 'paired' : state.screen;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <Animated.View
        key={screenKey}
        entering={FadeIn.duration(350)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1 }}>
        {pairing.status === 'unpaired' ? <PairingScreen state={pairing} /> : null}
        {pairing.status === 'paired' && pairing.justPaired ? <PairedScreen device={pairing.device} /> : null}
        {screenKey === 'idle' ? <IdleScreen /> : null}
        {screenKey === 'cart' ? <CartScreen cart={state.cart} /> : null}
        {screenKey === 'qr' && state.payment ? (
          <QrScreen payment={state.payment} cart={state.cart} />
        ) : null}
        {screenKey === 'expired' ? <ExpiredScreen /> : null}
        {screenKey === 'paid' && state.paid ? <PaidScreen paid={state.paid} /> : null}
      </Animated.View>
      <DemoBar />
    </View>
  );
}
