import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CartScreen } from '@/src/components/display/cart-screen';
import { DemoBar } from '@/src/components/display/demo-bar';
import { IdleScreen } from '@/src/components/display/idle-screen';
import { QrScreen } from '@/src/components/display/qr-screen';
import { ExpiredScreen, PaidScreen } from '@/src/components/display/status-screens';
import { useDisplay } from '@/src/display/display-store';

const KEEP_AWAKE_TAG = 'customer-display';

/**
 * Màn hình phía khách của quầy: một route duy nhất, nội dung đổi theo `state.screen`
 * (idle → cart → qr → paid). Không có điều hướng/nút bấm — khách không thao tác được gì.
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <Animated.View
        key={state.screen}
        entering={FadeIn.duration(350)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1 }}>
        {state.screen === 'idle' ? <IdleScreen /> : null}
        {state.screen === 'cart' ? <CartScreen cart={state.cart} /> : null}
        {state.screen === 'qr' && state.payment ? (
          <QrScreen payment={state.payment} cart={state.cart} />
        ) : null}
        {state.screen === 'expired' ? <ExpiredScreen /> : null}
        {state.screen === 'paid' && state.paid ? <PaidScreen paid={state.paid} /> : null}
      </Animated.View>
      <DemoBar />
    </View>
  );
}
