import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  // Load a specific food with extras based on routeParams id
  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get(`foods/${routeParams.id}`);

      const responseFood = response.data as Food;

      Object.assign(responseFood, {
        formattedPrice: formatValue(responseFood.price),
      });

      responseFood.extras = responseFood.extras.map(extra => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      setFood(responseFood);

      setExtras(responseFood.extras);

      const responseFavorite = await api.get('favorites');

      const favorites = responseFavorite.data as Food[];

      const isFavoriteResponse = favorites.find(
        favorite => favorite.id === routeParams.id,
      );

      if (isFavoriteResponse) {
        setIsFavorite(true);
      }
    }

    loadFood();
  }, [routeParams]);

  // Increment extra quantity
  const handleIncrementExtra = useCallback(
    (id: number) => {
      const newExtras = extras;

      const indexExtra = newExtras.findIndex(extra => extra.id === id);

      newExtras[indexExtra].quantity += 1;

      setExtras([...newExtras]);
    },
    [extras],
  );

  // Decrement extra quantity
  const handleDecrementExtra = useCallback(
    (id: number) => {
      const newExtras = extras;

      const indexExtra = newExtras.findIndex(extra => extra.id === id);

      if (newExtras[indexExtra].quantity !== 0) {
        newExtras[indexExtra].quantity -= 1;

        setExtras([...newExtras]);
      }
    },
    [extras],
  );

  // Increment food quantity
  const handleIncrementFood = useCallback(() => {
    setFoodQuantity(foodQuantity + 1);
  }, [foodQuantity]);

  // Decrement food quantity
  const handleDecrementFood = useCallback(() => {
    if (foodQuantity !== 1) {
      setFoodQuantity(foodQuantity - 1);
    }
  }, [foodQuantity]);

  // Toggle if food is favorite or not
  const toggleFavorite = useCallback(async () => {
    if (isFavorite) {
      await api.delete(`favorites/${food.id}`);
    } else {
      await api.post('favorites', food);
    }
    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  // Calculate cartTotal
  const cartTotal = useMemo(() => {
    let total = food.price * foodQuantity;

    extras.map(extra => {
      total += extra.quantity * extra.value;
      return total;
    });

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  // Finish the order and save on the API
  const handleFinishOrder = useCallback(async () => {
    await api.post('orders', {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      extras: food.extras,
    });
    navigation.goBack();
  }, [food, navigation]);

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={handleFinishOrder}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
